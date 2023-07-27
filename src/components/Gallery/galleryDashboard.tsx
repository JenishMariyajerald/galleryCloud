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
  Alert,
} from 'react-native';

import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import NetInfo from '@react-native-community/netinfo';
import moment from 'moment';
import {realmContext, TestRealm} from '../../realm';
import {ProgressBar, cameraOptions} from './utils';
import CustomDialog from '../Dialog/dialog';

interface MainScreenProps {}
interface ProgressState {
  [key: string]: number;
}

const {useQuery, useRealm} = realmContext;

const Gallery: React.FC<MainScreenProps> = () => {
  const [progress, setProgress] = useState<ProgressState>({});
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSearchFocused, setSearchFocused] = useState<boolean>(false);
  const [selectedObject, SetSelectedObject] = useState<any>({});
  const [progressModalVisible, setProgressModalVisible] =
    useState<boolean>(false);

  const realm = useRealm();
  let data = useQuery<TestRealm>(TestRealm);

  const realmData = React.useMemo(() => data, [data]);

  const handleInputFocus = () => {
    setSearchFocused(true);
  };

  const handleInputBlur = () => {
    setSearchFocused(false);
  };
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const filtered = imagesList.filter(item =>
      item.toLowerCase().includes(value.toLowerCase()),
    );
  };

  const isNetOn = React.useMemo(async () => {
    const netInfoState = await NetInfo.fetch();
    const internet =
      netInfoState.isConnected && netInfoState.isInternetReachable;
    return internet;
  }, []);

  const openCamera = () => {
    launchCamera(cameraOptions, (res: ImagePickerResponse) => {
      if (res.assets) {
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
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;
    realm.write(() => {
      realm.create('TestRealm', {
        _id: new Realm.BSON.ObjectID(),
        name: filename,
        url: image.uri,
        completed: true,
        isOnline: false,
        createdAt: new Date(),
      });
    });
  };

  const onGalleryUploadPress = async (assetImage: any) => {
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;
    let pathToFile: any;
    if (Platform.OS === 'android') {
      pathToFile = assetImage.uri;
    } else if (Platform.OS === 'ios') {
      pathToFile = assetImage.uri.replace('file://', '');
    }
    realm.write(() => {
      realm.create('TestRealm', {
        _id: new Realm.BSON.ObjectID(),
        name: filename,
        url: assetImage.uri,
        isOnline: false,
        completed: true,
        createdAt: new Date(),
      });
      const storageRef = storage().ref('images').child(filename);
      const task = storageRef.putFile(pathToFile);
      task.on('state_changed', taskSnapshot => {
        const percentage =
          taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;
        setProgress(prevState => ({...prevState, [pathToFile]: percentage}));
      });
      task.then(() => {
        let updt = realm.objects('TestRealm');
        realm.write(() => {
          const updateData: any = updt.find((k: any) => k.name === filename);
          updateData.isOnline = true;
        });
      });
    });
  };

  const uploadImage = async (image: Asset) => {
    const isNext = await isNetOn;
    if (isNext) {
      onGalleryUploadPress(image);
    } else {
      uploadToRealm(image);
    }
  };

  const getImageFromFirebaseStorage = async () => {
    const imageRefs = await storage().ref().child('images/').listAll();
    const firbaseImage: any = await Promise.all(
      imageRefs.items.map(ref => {
        return ref.name;
      }),
    );
    data.forEach((i: any) => {
      const isExist = firbaseImage.find((k: any) => k === i.name);
      if (isExist) {
        realm.write(() => {
          i.isOnline = true;
        });
      } else {
        realm.write(() => {
          let pathToFile: any;
          if (Platform.OS === 'android') {
            pathToFile = i.url;
          } else if (Platform.OS === 'ios') {
            pathToFile = i.url.replace('file://', '');
          }
          const storageRef = storage().ref('images').child(i.name);
          const task = storageRef.putFile(pathToFile);
          task.on('state_changed', taskSnapshot => {
            const percentage =
              taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;

            setProgress(prevState => ({
              ...prevState,
              [pathToFile]: percentage,
            }));
          });
          task.then(() => {
            realm.write(() => {
              i.isOnline = true;
            });
          });
        });
      }
    });
  };
  useEffect(() => {
    getImageFromFirebaseStorage();
  }, [isNetOn, !isNetOn]);

  const onDeletePress = async () => {
    // console.log('realmDB', realmDB);
    setProgressModalVisible(false);
    console.log(selectedObject.isOnline, 'selectedObject', selectedObject.name);
    let name = selectedObject.name;
    const isNet = await isNetOn;
    console.log('isNet', isNet);
    if (selectedObject.isOnline) {
      if (isNet) {
        const imageRef = storage().ref(`images/${name}`);
        imageRef
          .delete()
          .then(() => {
            realm.write(() => {
              realm.delete(selectedObject);
            });
            SetSelectedObject({});
            console.log('DELETED IN FIREBASE ==>');
          })
          .catch(error => {
            console.log('Error deleting image: ====> \n\n', error);
          });
      } else if (isNet === false) {
        Alert.alert('no internet');
        SetSelectedObject({});
      }
    }
    if (!selectedObject.isOnline) {
      console.log('deleteeeee');
      realm.write(() => {
        realm.delete(selectedObject);
      });
      SetSelectedObject({});
    }
  };
  const renderItem = ({item}: {item: any}) => {
    return (
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={{
            uri: item.url,
          }}
        />
        {progress[item.url] !== undefined && progress[item.url] !== 1 && (
          <ProgressBar uploadProgress={progress[item.url]} />
        )}

        <Text>{item.isOnline ? 'Online' : 'Offline'}</Text>

        {data.length > 0 && (
          <View style={styles.crossMark}>
            <TouchableOpacity
              onPressIn={() => {
                SetSelectedObject(item);
                setProgressModalVisible(true);
                // onDeletePress(item);
              }}>
              <Image
                style={[styles.crossImage]}
                source={require('../../assets/disabled.png')}
              />
            </TouchableOpacity>
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
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          style={styles.input}
          placeholder="Search Images"
        />
        <TouchableOpacity
          onPress={() => {
            handleInputChange(inputValue);
          }}>
          <Text style={styles.searchButton}>Search</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          numColumns={3}
          data={realmData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>

      {!isSearchFocused && (
        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
          }}
          style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
      )}

      <CustomDialog
        mode="selection"
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
      <CustomDialog
        mode="delete"
        title="Are you sure want to"
        visible={progressModalVisible}
        onClose={() => setProgressModalVisible(false)}
        onCancelSelect={() => setProgressModalVisible(false)}
        onDelete={() => {
          onDeletePress();
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
    backgroundColor: 'black',
    borderWidth: 1,
  },
  crossImage: {
    width: 14,
    height: 14,
    tintColor: 'white',
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
