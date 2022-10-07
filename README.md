React Native connector for [Journey3](https://journey3.net/) (Lightweight Anonymous Mobile Analytics)

## Features

Use this connector in your React Native app to:
- Track sessions, unique users and new users
- Track application feature usage
- Track user journey stage conversions
- Track user retention

## Getting started

- Register and get an application key at https://journey3.net/
- Initialize the connector to start tracking stats

## Usage

### Installing the connector

```
yarn add journey3-react-native-sdk
```

Additionally, you need to install ```@react-native-async-storage/async-storage``` as a peer dependency:

```
yarn add @react-native-async-storage/async-storage
```

### Initializing the connector

```js
import {useEffect} from 'react';
import {initialize} from 'journey3-react-native-sdk';

const version = '1.0'; // Your app version
const isRelease = production ? true : false; // Separate dev stats from production stats
useEffect(() => {
  initialize(
    '<accountId>',
    '<appId>',
    version,
    isRelease,
  );
}, []);
```

### Report an event

Events are used to track feature usage:

```js
import {reportEvent} from 'journey3-react-native-sdk';

useEffect(() => {
  reportEvent('click_play');
}, []);
```

### Report an error

Errors are special types of events:

```js
import {reportError} from 'journey3-react-native-sdk';

useEffect(() => {
  reportError('err_loading_catalog');
}, []);
```

### Report a stage transition

Stage transitions are used to build user conversion funnels:

```js
import {reportStageTransition} from 'journey3-react-native-sdk';

useEffect(() => {
  reportStageTransition(2, 'explore');
}, []);
```

It's up to you what stages you would like to use, we recommend to start with the following stages:

| stage | name | comment |
| ------| ---- | ------- |
| 1 | 'new user' | Is used as an initial stage by default for all sessions. You don't need to report this stage |
| 2 | 'explore' | The user has used some basic features of the app. For example: the user has browsed through the catalog of music albums |
| 3 | 'engage' | The user has used one of the main features of the app. For example: the user has started playing the album |
| 4 | 'commit' | The user has bought the subscription service for your app |

You don't need to remember which stage you already reported. The plugin will remember the highest stage that you reported.

Maximum 10 stages are supported.

### Flush events

Normally, the previous session is reported upon the app restart. In some cases you might want to report events before the session is terminated by forcefully calling _flushEvents_ function.

This might help tracking events coming from users who use the app once and then immediately uninstall it.

```js
import {flushEvents} from 'journey3-react-native-sdk';

flushEvents();
```

Flushing events introduces extra network traffic, so use it with caution. Do not flush session every time you report an event!

## GDPR compliance

Journey3 is designed to be anonymous by default.

Most of the data is stored in the aggregated form (as counters), the session correlation is done on the device itself.

We store:

- Number of session in the given period of time, by version;
- Number of unique users in the given period of time, by version;
- Number of new users in the given period of time, by version;
- Number of events in the given period of time, by event name and version;
- Number of sessions that triggered an event in the given period of time, by event name and version;
- Number of sessions with errors in the given period of time, by version;
- Number of sessions with crashes in the given period of time, by version;
- Number of stage hits in the given period of time, by version;
- Number of sessions bucketed by duration, in the given period of time, by version;
- Number of sessions bucketed by retention, in the given period of time, by version.

In addition to counters, Journey3 stores _sessions_. A session includes the following data:

- Version;
- Duration;
- Whether the session is from the first time user;
- The sequences of events.

The retention period for the session is 15 days.

We don't store any device information or anything that can help identifying a user. These is no field that would allow to link sessions from the same user.

To preserve the anonymity, use event names that describe the feature used, and avoid adding any identifiable data.

__Example, good:__ 'click_play', 'click_pause', 'add_to_favorites', 'search_by_artist'.

__Example, bad:__ 'user_12345_bought_item_34556'

As we don't track any personally personally identifiable data, and make our best effort to render the stored data anonymous, we judge that the data collected by the connector does not fall within the scope of the GDPR.

That is, unless you abuse the API and use event or stage names that break the anonymity.

This assumption might also break due to some specific circumstances related to your app nature and purpose that we cannot predict.

__This is why we encourage you to review the terms of GDPR law and make your own final decision whether to enable the connector with or without opt-in, and whether to mention the data collected in your privacy policy.__