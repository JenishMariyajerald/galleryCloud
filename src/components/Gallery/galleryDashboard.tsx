/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Image,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';

import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

import storage from '@react-native-firebase/storage';
import {realmContext, TestRealm} from '../../realm';
import {ProgressView} from '@react-native-community/progress-view';
import NetInfo from '@react-native-community/netinfo';
import CustomDialog from '../Dialog/dialog';

interface MainScreenProps {}

const {useQuery, useRealm} = realmContext;

const Gallery: React.FC<MainScreenProps> = () => {
  const [progress, setProgress] = useState<number>();
  const [currentUploadingUri, setCurrentUploadingUri] = useState<string>();
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const realm = useRealm();
  let data = useQuery<TestRealm>(TestRealm);

  useEffect(() => {
    fetchImagesFromStorage();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Calleddd', JSON.stringify(state));
        data.map(async item => {
          await handleImageWithiFirebaseStorage(item.url);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const openCamera = () => {
    launchCamera({mediaType: 'photo'}, (res: ImagePickerResponse) => {
      if (res.assets) {
        console.log('CaptureRes:', JSON.stringify(res.assets[0].uri));
        const image = res.assets[0];
        uploadImage(image);
        toggleModal();
      } else if (res.didCancel) {
        console.log('User canclled the image:');
      } else {
        console.log('CapturingPictureFailureRes:', JSON.stringify(res));
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, (res: ImagePickerResponse) => {
      console.log('PickingPictureFailureRes:', JSON.stringify(res));
      if (res.assets) {
        const image = res.assets[0];
        uploadImage(image);
        toggleModal();
      } else if (res.didCancel) {
        console.log('User canclled the image:');
      } else {
        console.log('PickingPictureFailureRes:', JSON.stringify(res));
      }
    });
  };

  const handleImageWithRealm = (image: Asset) => {
    console.log('Selected image URI: ', image.uri);
    realm.write(() => {
      realm.create('TestRealm', {
        _id: new Realm.BSON.ObjectID(),
        name: 'Example',
        url: image.uri,
        completed: true,
        createdAt: new Date(),
      });
    });
  };

  const DeleteObjectFormRealm = (url: string) => {
    const deleteIndex = data.findIndex(item => {
      return item.url === url;
    });
    if (deleteIndex >= 0) {
      realm.write(() => {
        realm.delete(data[deleteIndex]);
        fetchImagesFromStorage();
      });
    }
  };

  const handleImageWithiFirebaseStorage = (uri: any) => {
    fetchImagesFromStorage();
    const filename = uri?.substring(uri.lastIndexOf('/') + 1);
    let pathToFile;
    if (Platform.OS === 'android') {
      pathToFile = uri;
    } else if (Platform.OS === 'ios') {
      pathToFile = uri.replace('file://', '');
    }

    const storageRef = storage().ref('images').child(filename);
    const task = storageRef.putFile(pathToFile);
    const imageListCopy = [...imagesList];
    imageListCopy.push(uri);
    console.log('ImageList', imageListCopy);
    setImagesList(imageListCopy);
    setCurrentUploadingUri(uri);
    task.on('state_changed', taskSnapshot => {
      const percentage =
        taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;
      setProgress(percentage);
    });

    task.then(() => {
      if (data.length) {
        DeleteObjectFormRealm(uri);
      }
      console.log('Image uploaded to the bucket!');
    });
  };

  const uploadImage = async (image: Asset) => {
    handleImageWithRealm(image);
    handleImageWithiFirebaseStorage(image.uri);
  };
  const fetchImagesFromStorage = async () => {
    const imageRefs = await storage().ref().child('images/').listAll();
    console.log('imageRefs', imageRefs);
    const urls = await Promise.all(
      imageRefs.items.map(ref => {
        return ref.getDownloadURL();
      }),
    );

    const localUrls = data.map(i => {
      return i.url;
    });
    const finalUrls = [...localUrls, ...urls];
    setImagesList(finalUrls);
  };

  const renderItem = ({item}: {item: any}) => {
    return (
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={{
            uri: item,
          }}
        />
        {currentUploadingUri === item && progress !== 1 && (
          <View style={styles.crossMark}>
            <Image
              style={[styles.crossImage]}
              source={require('../../assests/disabled.png')} // Replace with the path to your cross image
            />
          </View>
        )}

        {currentUploadingUri === item && progress !== 1 && (
          <ProgressView
            style={{height: 80}}
            progressTintColor="orange"
            trackTintColor="white"
            progress={progress}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity style={styles.inputContainer}>
          <TextInput placeholder="Search image" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchTextContainer} onPress={() => {}}>
          <Text style={styles.searchText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          numColumns={3}
          data={imagesList}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>

      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        style={styles.buttonContainer}>
        <Text style={styles.buttonText}>Upload</Text>
      </TouchableOpacity>
      <CustomDialog
        title="Choose an Option"
        visible={isModalVisible}
        onClose={() => toggleModal()}
        onCameraSelect={() => {
          openCamera();
        }}
        onLibrarySelect={() => {
          openGallery();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  listContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  searchBarContainer: {
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 50,
    marginHorizontal: 10,
  },
  crossMark: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderColor: 'red',
    borderWidth: 1,
  },
  crossImage: {
    width: 14,
    height: 14,
    tintColor: 'red', // Customize the color of the cross image if needed
  },
  buttonContainer: {
    padding: 10,
    width: '90%',
    marginVertical: 10,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },

  searchTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalItem: {
    padding: 15,
  },
  modalText: {
    color: 'black',
  },
  modalSeparator: {
    backgroundColor: 'grey',
    borderWidth: 0.5,
    width: '100%',
  },
  imageContainer: {
    margin: 7,
  },
  image: {
    width: (Dimensions.get('window').width - 50) / 3,
    height: (Dimensions.get('window').width - 50) / 3,
  },
  searchText: {
    color: 'white',
  },
});

export default Gallery;
