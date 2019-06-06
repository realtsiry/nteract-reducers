# @nteract/reducers

This package contains a set of Redux reducers for use in nteract applications.

## Installation

```
$ yarn add @nteract/reducers
```

```
$ npm install --save @nteract/reducers
```

## Usage

The example below shows how we can use the functions within this package and those within `@nteract/actions` and `@nteract/types` to set the `isSaving` property on a notebook state.

```javascript
import * as reducers from "@nteract/reducers";
import * as actions from "@nteract/actions";
import * as state from "@nteract/types";

export default () => {
  const originalState = state.makeAppRecord({
    isSaving: true
  });
  reducers.app(originalState, actions.saveFulfilled({}));
};
```

## Documentation

We're working on adding more documentation for this component. Stay tuned by watching this repository!

## Support

If you experience an issue while using this package or have a feature request, please file an issue on the [issue board](https://github.com/nteract/nteract/issues/new/choose) and add the `pkg:reducers` label.

## License

[BSD-3-Clause](https://choosealicense.com/licenses/bsd-3-clause/)
