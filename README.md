# dmhy-notifier

To be updated.

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

```
/subs xxx
```

```
/subs xxx,yyy
```

```
/subs xxx;@
```

```
/subs xxx;fansubKeywords
```

```
/listsubs
```

```
/list
```

```
/check
```

```
/delsubs xxx
```
