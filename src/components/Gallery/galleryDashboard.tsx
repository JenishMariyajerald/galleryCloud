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
  PhotoQuality,
} from 'react-native-image-picker';

import storage from '@react-native-firebase/storage';
import {realmContext, TestRealm} from '../../realm';
import {ProgressView} from '@react-native-community/progress-view';
import NetInfo from '@react-native-community/netinfo';
import CustomDialog from '../Dialog/dialog';
import moment from 'moment';
interface MainScreenProps {}
interface ProgressState {
  [key: string]: number;
}

const {useQuery, useRealm} = realmContext;

const Gallery: React.FC<MainScreenProps> = () => {
  const [progress, setProgress] = useState<ProgressState>({});
  const [currentUploadingUri, setCurrentUploadingUri] = useState<string[]>([]);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');

  const realm = useRealm();
  let data = useQuery<TestRealm>(TestRealm);

  useEffect(() => {
    getImageFromFirebaseStorage();
    const checkInternetConnection = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Internet is connected', JSON.stringify(state));
        data.map(async item => {
          await uploadToFirebase(item.url);
        });
      }
    });

    return () => {
      checkInternetConnection();
    };
  }, []);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const cameraOptions = {
    mediaType: 'photo' as const,
    quality: 0.5 as PhotoQuality | undefined,
    cameraType: 'front' as const,
  };
  const openCamera = () => {
    launchCamera(cameraOptions, (res: ImagePickerResponse) => {
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

  const uploadToRealm = (image: Asset) => {
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
        getImageFromFirebaseStorage();
      });
    }
  };

  const uploadToFirebase = (uri: any) => {
    getImageFromFirebaseStorage();
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;
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
    setImagesList(imageListCopy);
    const unUpload = [...currentUploadingUri];
    unUpload.push(uri);
    setCurrentUploadingUri(unUpload);

    task.on('state_changed', taskSnapshot => {
      const percentage =
        taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;
      setProgress(prevProgress => ({
        ...prevProgress,
        [uri]: percentage,
      }));
    });
    task.then(() => {
      if (data.length) {
        DeleteObjectFormRealm(uri);
        setCurrentUploadingUri([]);
      }
      console.log('Image uploaded to the bucket!');
    });
  };

  const uploadImage = async (image: Asset) => {
    uploadToFirebase(image.uri);
    uploadToRealm(image);
  };
  const getImageFromFirebaseStorage = async () => {
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
    const finalUrls = [...urls, ...localUrls];
    setImagesList(finalUrls);
  };

  const renderItem = ({item}: {item: any}) => {
    const isUploadedToFirebase = imagesList.includes(item);
    const isUploading = currentUploadingUri.includes(item);
    const uploadProgress = progress && progress[item];

    return (
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={{
            uri: item,
          }}
        />
        {isUploadedToFirebase && isUploading && (
          <View style={styles.crossMark}>
            <Image
              style={[styles.crossImage]}
              source={require('../../assests/disabled.png')}
            />
          </View>
        )}
        {isUploading && uploadProgress !== undefined && (
          <View>
            <ProgressView
              style={{height: 40}}
              progressTintColor="green"
              trackTintColor="black"
              progress={uploadProgress}
              progressViewStyle="bar"
            />
            <Text>{`${Math.round(uploadProgress * 100)}%`}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputView}>
        <TextInput
          value={inputValue}
          onChangeText={val => setInputValue(val)}
          style={styles.input}
          placeholder="Search Images"
        />
        <TouchableOpacity>
          <Text style={styles.searchButton}>Search</Text>
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
    backgroundColor: 'white',
  },
  listContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  inputView: {
    flexDirection: 'row',
    padding: 10,
    marginTop: 20,
  },
  input: {
    fontSize: 20,
    borderColor: 'gray',
    backgroundColor: '#EEEEEE',
    height: 40,
    borderWidth: 0.5,
    borderRadius: 12,
    flexGrow: 1,
    padding: 10,
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
    tintColor: 'red',
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
  searchButton: {
    color: 'black',
    padding: 12,
  },
  buttonText: {
    color: 'white',
  },
  imageContainer: {
    margin: 7,
  },
  image: {
    width: (Dimensions.get('window').width - 50) / 3,
    height: (Dimensions.get('window').width - 50) / 3,
  },
});

export default Gallery;
