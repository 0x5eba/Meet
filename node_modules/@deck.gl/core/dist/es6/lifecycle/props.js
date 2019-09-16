import assert from '../utils/assert';
export function validateProps(props) {
  const propTypes = getPropTypes(props);

  for (const propName in propTypes) {
    const propType = propTypes[propName];
    const validate = propType.validate;

    if (validate && !validate(props[propName], propType)) {
      throw new Error(`Invalid prop ${propName}: ${props[propName]}`);
    }
  }
}
export function diffProps(props, oldProps) {
  const propsChangedReason = compareProps({
    newProps: props,
    oldProps,
    propTypes: getPropTypes(props),
    ignoreProps: {
      data: null,
      updateTriggers: null,
      extensions: null
    }
  });
  const dataChangedReason = diffDataProps(props, oldProps);
  let updateTriggersChangedReason = false;

  if (!dataChangedReason) {
    updateTriggersChangedReason = diffUpdateTriggers(props, oldProps);
  }

  return {
    dataChanged: dataChangedReason,
    propsChanged: propsChangedReason,
    updateTriggersChanged: updateTriggersChangedReason,
    extensionsChanged: diffExtensions(props, oldProps)
  };
}
export function compareProps() {
  let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      newProps = _ref.newProps,
      oldProps = _ref.oldProps,
      _ref$ignoreProps = _ref.ignoreProps,
      ignoreProps = _ref$ignoreProps === void 0 ? {} : _ref$ignoreProps,
      _ref$propTypes = _ref.propTypes,
      propTypes = _ref$propTypes === void 0 ? {} : _ref$propTypes,
      _ref$triggerName = _ref.triggerName,
      triggerName = _ref$triggerName === void 0 ? 'props' : _ref$triggerName;

  assert(oldProps !== undefined && newProps !== undefined, 'compareProps args');

  if (oldProps === newProps) {
    return null;
  }

  if (typeof newProps !== 'object' || newProps === null) {
    return `${triggerName} changed shallowly`;
  }

  if (typeof oldProps !== 'object' || oldProps === null) {
    return `${triggerName} changed shallowly`;
  }

  for (const key of Object.keys(newProps)) {
    if (!(key in ignoreProps)) {
      if (!(key in oldProps)) {
        return `${triggerName}.${key} added`;
      }

      const changed = comparePropValues(newProps[key], oldProps[key], propTypes[key]);

      if (changed) {
        return `${triggerName}.${key} ${changed}`;
      }
    }
  }

  for (const key of Object.keys(oldProps)) {
    if (!(key in ignoreProps)) {
      if (!(key in newProps)) {
        return `${triggerName}.${key} dropped`;
      }

      if (!Object.hasOwnProperty.call(newProps, key)) {
        const changed = comparePropValues(newProps[key], oldProps[key], propTypes[key]);

        if (changed) {
          return `${triggerName}.${key} ${changed}`;
        }
      }
    }
  }

  return null;
}

function comparePropValues(newProp, oldProp, propType) {
  let equal = propType && propType.equal;

  if (equal && !equal(newProp, oldProp, propType)) {
    return 'changed deeply';
  }

  if (!equal) {
    equal = newProp && oldProp && newProp.equals;

    if (equal && !equal.call(newProp, oldProp)) {
      return 'changed deeply';
    }
  }

  if (!equal && oldProp !== newProp) {
    return 'changed shallowly';
  }

  return null;
}

function diffDataProps(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  let dataChanged = null;
  const dataComparator = props.dataComparator,
        _dataDiff = props._dataDiff;

  if (dataComparator) {
    if (!dataComparator(props.data, oldProps.data)) {
      dataChanged = 'Data comparator detected a change';
    }
  } else if (props.data !== oldProps.data) {
    dataChanged = 'A new data container was supplied';
  }

  if (dataChanged && _dataDiff) {
    dataChanged = _dataDiff(props.data, oldProps.data) || dataChanged;
  }

  return dataChanged;
}

function diffUpdateTriggers(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  if ('all' in props.updateTriggers) {
    const diffReason = diffUpdateTrigger(props, oldProps, 'all');

    if (diffReason) {
      return {
        all: true
      };
    }
  }

  const triggerChanged = {};
  let reason = false;

  for (const triggerName in props.updateTriggers) {
    if (triggerName !== 'all') {
      const diffReason = diffUpdateTrigger(props, oldProps, triggerName);

      if (diffReason) {
        triggerChanged[triggerName] = true;
        reason = triggerChanged;
      }
    }
  }

  return reason;
}

function diffExtensions(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  const oldExtensions = oldProps.extensions;
  const extensions = props.extensions;

  if (extensions === oldExtensions) {
    return false;
  }

  if (extensions.length !== oldExtensions.length) {
    return true;
  }

  for (let i = 0; i < extensions.length; i++) {
    if (!extensions[i].equals(oldExtensions[i])) {
      return true;
    }
  }

  return false;
}

function diffUpdateTrigger(props, oldProps, triggerName) {
  let newTriggers = props.updateTriggers[triggerName];
  newTriggers = newTriggers === undefined || newTriggers === null ? {} : newTriggers;
  let oldTriggers = oldProps.updateTriggers[triggerName];
  oldTriggers = oldTriggers === undefined || oldTriggers === null ? {} : oldTriggers;
  const diffReason = compareProps({
    oldProps: oldTriggers,
    newProps: newTriggers,
    triggerName
  });
  return diffReason;
}

function getPropTypes(props) {
  const layer = props._component;
  const LayerType = layer && layer.constructor;
  return LayerType ? LayerType._propTypes : {};
}
//# sourceMappingURL=props.js.map