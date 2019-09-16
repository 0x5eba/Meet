'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var extend = _interopDefault(require('just-extend'));
var pWaterfall = _interopDefault(require('p-waterfall'));
var isDom = _interopDefault(require('is-dom'));
var isBrowser = _interopDefault(require('is-in-browser'));

function combineEmbedsText(embeds) {
    return embeds.sort((a, b) => a.index - b.index).map(({content}) => content).join(" ");
}

function appendEmbedsAtEnd({result, _embeds}) {
    return `${result} ${combineEmbedsText(_embeds)}`;
}

function isElementPresent({input, target}) {
    return isDom(input) || target && isDom(target);
}

class EmbedJS {
    constructor(options) {
        const defaultOptions = {
            plugins: [],
            preset: null,
            fetch: isBrowser && (window.fetch || window.unfetch),
            inlineEmbed: true,
            replaceUrl: false,
            _embeds: [],
            _services: []
        };
        let {input, plugins = [], preset} = options;
        if (!input) {
            throw new Error("You need to pass input element or string in the options object.");
        }
        const inputString = isDom(input) ? input.innerHTML : input;
        this.options = extend({}, defaultOptions, options, {
            result: inputString,
            plugins: preset ? plugins.concat(preset) : plugins,
            inputString
        });
    }
    text() {
        const options = this.resetOptions();
        const transformers = options.plugins.map(p => p.transform);
        return pWaterfall(transformers, options);
    }
    resetOptions() {
        return extend({}, this.options, {
            _embeds: []
        });
    }
    load() {
        this.options.plugins.forEach(p => p.onLoad && p.onLoad(this.options));
    }
    render() {
        return new Promise(($return, $error) => {
            var input, target, inlineEmbed, element;
            let options;
            ({input, target, inlineEmbed} = this.options);
            if (!isElementPresent(this.options)) {
                return $error(new Error("You haven't passed the input as an element."));
            }
            if (isDom(input) && input.classList.contains("ejs-applied")) {
                options = this.options;
                return $If_1.call(this);
            } else {
                return this.text().then($await_2 => {
                    try {
                        options = $await_2;
                        element = target || input;
                        element.innerHTML = inlineEmbed ? options.result : appendEmbedsAtEnd(options);
                        element.classList.add("ejs-applied");
                        return $If_1.call(this);
                    } catch ($boundEx) {
                        return $error($boundEx);
                    }
                }, $error);
            }
            function $If_1() {
                this.load();
                return $return(options);
            }
            
        });
    }
    destroy() {
        const {inputString, input, target} = this.options;
        if (!isElementPresent(this.options)) {
            throw new Error("You haven't passed the input as an element.");
        }
        const element = target || input;
        element.innerHTML = inputString;
        element.classList.remove("ejs-applied");
        return this.options;
    }
}

module.exports = EmbedJS;
