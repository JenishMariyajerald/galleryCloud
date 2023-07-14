// import Realm from 'realm';
// import {createRealmContext} from '@realm/react';

// export class TestRealm extends Realm.Object{

//   _id! : Realm.BSON.ObjectId;
//   description!: string;
//   completed!: boolean;
//   createdAt!: Date;

// static schema = {
//   name: 'TestRealm',
//   properties: {
//     _id: 'objectId',
//     description:{type: 'string',default:"text"},
//     completed: {type: 'bool',default: false},
//     createdAt: 'date',
//   },
// };
// }
// export const realmContext = createRealmContext({
//   schema: [TestRealm],
//   onFirstOpen(realm) {
//     realm.create("TestRealm",{
//       _id: new Realm.BSON.ObjectId(),
//       description: "Learn Realm React Native",
//       completed: false,
//       createdAt: new Date()
//     }
//     );
//     realm.create("TestRealm",{
//       _id: new Realm.BSON.ObjectId(),
//       description: "Copy one",
//       completed: false,
//       createdAt: new Date()
//     }
//     )
//   }
// });

import Realm from 'realm';
import {createRealmContext} from '@realm/react';

export class TestRealm extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  public url!: string;
  completed!: boolean;
  createdAt!: Date;

  static schema = {
    name: 'TestRealm',
    properties: {
      _id: 'objectId',
      name: 'string',
      url: 'string',
      completed: {type: 'bool', default: false},
      createdAt: 'date',
    },
  };
}
export const realmContext = createRealmContext({
  schema: [TestRealm],
});
