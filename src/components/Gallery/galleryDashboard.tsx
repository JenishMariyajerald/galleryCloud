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
  const [currentUploadingUri, setCurrentUploadingUri] = useState<string[]>([]);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [filteredData, setFilteredData] = useState<string[]>([]);
  const [isSearchFocused, setSearchFocused] = useState<boolean>(false);
  const [realmData, setRealmData] = useState<string[]>([]);
  const [uploadTask, setUploadTask] = useState<any>();
  const initialUploadRef = React.useRef<boolean>(true);

  const [progressModalVisible, setProgressModalVisible] =
    useState<boolean>(false);
  const [pause, setPause] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [internetActive, setInternetActive] = useState<boolean>(false);
  const realm = useRealm();
  let data = useQuery<TestRealm>(TestRealm);

  useEffect(() => {
    getImageFromFirebaseStorage();
    const RealmValue = data.map(i => {
      return i.url;
    });
    setRealmData(RealmValue);
    const checkInternetConnection = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        if (state.isInternetReachable) {
          setInternetActive(true);
        } else {
          setInternetActive(false);
        }
      }
    });

    return () => {
      checkInternetConnection();
    };
  }, []);

  useEffect(() => {
    // Upload images from Realm data if internet is active
    if (internetActive) {
      data.map(async item => {
        await uploadToFirebase(item.url);
      });
    }
  }, [internetActive]);
  console.log('Active', internetActive);
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
    setFilteredData(filtered);
  };

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
    realm.write(() => {
      realm.create('TestRealm', {
        _id: new Realm.BSON.ObjectID(),
        name: 'Example',
        url: image.uri,
        completed: true,
        createdAt: new Date(),
      });
    });
    const RealmValue = data.map(i => {
      return i.url;
    });
    setRealmData(RealmValue);
  };

  const uploadToFirebase = (uri: any) => {
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
    setUploadTask(task);
    // const imageListCopy = [...imagesList];
    // imageListCopy.push(uri);
    // const filteredDataCopy = [...filteredData];
    // filteredDataCopy.push(uri);
    filteredData.push(uri);
    // setImagesList(filteredDataCopy);
    // setFilteredData(filteredDataCopy);
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
      // DeleteObjectFormRealm(uri);
      const deleteIndex = data.findIndex(item => {
        return item.url === uri;
      });

      realm.write(() => {
        realm.delete(data[deleteIndex]);
      });
      // setCurrentUploadingUri([]);
      console.log('Image uploaded to the bucket!');
    });
  };

  const uploadImage = async (image: Asset) => {
    console.log('InternetConnectionStatus', internetActive);
    if (internetActive) {
      // uploadToRealm(image);
      uploadToFirebase(image.uri);
    } else {
      uploadToRealm(image);
    }
  };

  const getImageFromFirebaseStorage = async () => {
    const imageRefs = await storage().ref().child('images/').listAll();
    const urls = await Promise.all(
      imageRefs.items.map(ref => {
        return ref.getDownloadURL();
      }),
    );

    const localUrls = data.map(i => {
      return i.url;
    });
    setRealmData(localUrls);
    // const finalUrls = [...urls, ...localUrls];
    // setImagesList(finalUrls);
    setFilteredData(urls);
  };
  const pauseUpload = (index: number) => {
    console.log('index', index);
    uploadTask.pause();
    setPause(true);
    setSelectedIndex(index);
  };
  const resumeUpload = () => {
    setPause(false);

    setProgressModalVisible(false);
    uploadTask.resume();
  };
  const renderItem = ({item, index}: {item: string; index: number}) => {
    const isUploadedToFirebase = imagesList.includes(item);
    const uploadProgress = progress[item];

    return (
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={{
            uri: item,
          }}
        />
        {uploadProgress !== undefined && uploadProgress < 1 && (
          <View style={styles.crossMark}>
            <TouchableOpacity
              onPress={() => {
                if (!pause) {
                  pauseUpload(index);
                } else {
                  setProgressModalVisible(true);
                }
              }}>
              <Image
                style={[styles.crossImage]}
                source={
                  index === selectedIndex && pause
                    ? require('../../assests/play.png')
                    : require('../../assests/pause.png')
                }
              />
            </TouchableOpacity>
          </View>
        )}
        {uploadProgress !== undefined && uploadProgress < 1 && (
          <ProgressBar uploadProgress={uploadProgress} />
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
          data={data.length === 0 ? filteredData : realmData}
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
        mode="upload"
        title="Are you sure want to"
        visible={progressModalVisible}
        onClose={() => setProgressModalVisible(false)}
        onResumeSelect={() => {
          resumeUpload();
        }}
        onCancelSelect={() => setProgressModalVisible(false)}
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
