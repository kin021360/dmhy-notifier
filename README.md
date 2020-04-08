# dmhy-notifier

A Telegram bot for monitoring the latest dmhy RSS list.

You may subscribe a item based on name and fansub name.

It will check update for every two hours.

## Quick Start

Install the dependencies:

```bash
npm install
```

Start the program:

```bash
npm start
```

Set your **Telegram bot API token** to `tgBotToken` in `config.js`:

```js
const path = require('path');

module.exports = {
    tgBotToken: '', // Telegram bot API token
    cachedbPath: path.resolve(__dirname, './leveldb/cachedb'),
    userdbPath: path.resolve(__dirname, './leveldb/userdb')
};
```

## Bot commands

Subscribe a item where name contains `xxx` 
```
/subs xxx
```

Subscribe a item where name contains `xxx` or `yyy` or ... (comma separated)
```
/subs xxx,yyy
```

Subscribe a item where name contains `xxx` and using default fansub list  
Default fansub list is defined in `src/datastructures/Subscribe.js`
```
/subs xxx;@
```

Subscribe a item where name contains `xxx` and using your preferred fansub name (comma separated) 
```
/subs xxx;fansubKeywords
```

List your subscribed list
```
/list
```

Check update immediately
```
/check
```

Delete the subscribe by id (use `/list` to find the id first)
```
/delsubs id1,id2
```

List your subscribed list (RAW mode)
```
/listsubs
```