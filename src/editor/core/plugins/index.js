/*
 * @link https://www.humhub.org/
 * @copyright Copyright (c) 2017 HumHub GmbH & Co. KG
 * @license https://www.humhub.com/licences
 *
 */

import {inputRules, smartQuotes, emDash, ellipsis, InputRule} from "prosemirror-inputrules"
import {keymap} from "prosemirror-keymap"
import doc from "./doc"
import blockquote from "./blockquote"
import bullet_list from "./bullet_list"
import code from "./code"
import code_block from "./code_block"
import em from "./em"
import emoji from "./emoji"
import hard_break from "./hard_break"
import heading from "./heading"
import horizontal_rule from "./horizontal_rule"
import image from "./image"
import link from "./link"
import list_item from "./list_item"
import mention from "./mention"
import oembed from "./oembed"
import ordered_list from "./ordered_list"
import paragraph from "./paragraph"
import strikethrough from "./strikethrough"
import strong from "./strong"
import table from "./table"
import text from "./text"
import attributes from "./attributes"
import placeholder from "./placeholder"

const plugins = [];
const pluginMap = {};

const presets = {};

let registerPlugin = function(plugin, options) {
    options = options || {};

    plugins.push(plugin);
    pluginMap[plugin.id] = plugin;

    if(typeof options === 'string') {
        options = {preset:options};
    }

    if(options.preset) {
        addToPreset(plugin, options.preset, options);
    }
};

let addToPreset = function(plugin, presetId,  options) {
    if(typeof plugin === 'string') {
        plugin = pluginMap[plugin];
    }

    let preset = presets[presetId] ? presets[presetId].slice(0) : [];

    if(options['before'] && pluginMap[options['before']]) {
        let index = preset.indexOf(pluginMap[options['before']]);
        if (index >= 0) {
            preset.splice(index, 0, plugin);
        } else {
            console.warn('Tried appending plugin before non existing preset plugin: '+presetId+' before:'+options['before']);
            preset.push(plugin);
        }
    } else if(options['after'] && pluginMap[options['after']]) {
        let index = preset.indexOf(pluginMap[options['after']]);
        if (index >= 0) {
            preset.splice(index+1, 0, plugin);
        } else {
            console.warn('Tried appending plugin after non existing preset plugin: '+presetId+' after:'+options['after']);
            preset.push(plugin);
        }
    } else {
        preset.push(plugin);
    }

    presets[presetId] = preset;
};

let registerPreset = function(id, plugins) {

    let result = [];

    if(Array.isArray(plugins)) {
        plugins.forEach((pluginId) => {
            let plugin = pluginMap[pluginId];
            if(plugin) {
                result.push(plugin);
            }
        });
    } else if(plugins.extend) {
        let toExtend =  presets[plugins.extend];

        if(!toExtend) {
            console.error('Could not extend richtext preset '+plugins.extend+' preset not registered!');
            return;
        }

        if(plugins.exclude && Array.isArray(plugins.exclude)) {
            toExtend.forEach((plugin) => {
                if(plugin && !plugins.exclude.includes(plugin.id)) {
                    result.push(plugin);
                }
            });
        } else {
            result = toExtend.slice(0);
        }

        if(plugins.include && Array.isArray(plugins.include)) {
            plugins.include.forEach((plugin) => {
                if(!pluginMap[plugin]) {
                    console.error('Could not include plugin '+plugin+' to preset '+id+' plugin not found!');
                } else {
                    result.push(pluginMap[plugin]);
                }
            });
        }
    }

    presets[id] = result;

    if(plugins.callback) {
        plugins.callback.apply(result, [addToPreset])
    }
};

registerPlugin(doc, 'markdown');
registerPlugin(paragraph, 'markdown');
registerPlugin(blockquote, 'markdown');
registerPlugin(bullet_list, 'markdown');
registerPlugin(strong, 'markdown');
registerPlugin(code, 'markdown');
registerPlugin(code_block, 'markdown');
registerPlugin(emoji);
registerPlugin(hard_break, 'markdown');
registerPlugin(em, 'markdown');
registerPlugin(horizontal_rule, 'markdown');
registerPlugin(image, 'markdown');
registerPlugin(list_item, 'markdown');
registerPlugin(mention);
registerPlugin(oembed);
registerPlugin(ordered_list, 'markdown');
registerPlugin(heading, 'markdown');
registerPlugin(strikethrough, 'markdown');
registerPlugin(table, 'markdown');
registerPlugin(text, 'markdown');
registerPlugin(link, 'markdown');
registerPlugin(attributes, 'markdown');
registerPlugin(placeholder, 'markdown');

registerPreset('normal', {
    extend: 'markdown',
    callback: function(addToPreset) {

        addToPreset('emoji', 'normal', {
            'before': 'hard_break'
        });

        addToPreset('mention', 'normal', {
            'before': 'ordered_list'
        });

        addToPreset('oembed', 'normal', {
            'before': 'ordered_list'
        });
    }
});

registerPreset('full', {
    extend: 'normal'
});

console.log(presets);

let getPlugins = function(options = {}) {

    if(options.preset && presets[options.preset]) {
        return presets[options.preset].slice(0);
    }

    let result = [];
    if(!options.plugins || !options.plugins.exclude || !Array.isArray(options.plugins.exclude)) {
        result = plugins.slice(0);
    } else {
        let pluginFilter = (Array.isArray(options.plugins.exclude)) ? (plugin) => {
            return !options.plugins.exclude.includes(plugin.id)
        } : null;

        plugins.forEach((plugin) => {
            if(plugin && pluginFilter(plugin)) {
                result.push(plugin);
            }
        });
    }

    if(options.plugins && options.plugins.include && Array.isArray(options.plugins.include)) {
        result = result.concat(options.plugins.include);
    }

    if(options.preset) {
        presets[options.preset] = result;
        return result.slice(0);
    }

    return result;
};

let buildInputRules = function(options) {
    let plugins = getPlugins(options);
    let schema = options.schema;

    let rules = smartQuotes.concat([ellipsis, emDash]);
    plugins.forEach((plugin) => {
        if(plugin.inputRules) {
            rules = rules.concat(plugin.inputRules(schema));
        }
    });

    return inputRules({rules})
};

let buildPlugins = function(options) {
    let plugins = getPlugins(options);

    let result = [];
    plugins.forEach((plugin) => {
        if(plugin.plugins) {
            let pl = plugin.plugins(options);
            if(pl && pl.length) {
                result = result.concat(pl);
            }
        }
    });

    return result;
};

let buildPluginKeymap = function(options) {
    let plugins = getPlugins(options);

    let result = [];
    plugins.forEach((plugin) => {
        if(plugin.keymap) {
            result.push(keymap(plugin.keymap(options)));
        }
    });

    return result;
};


// https://github.com/ProseMirror/prosemirror/issues/710
const isChromeWithSelectionBug = !!navigator.userAgent.match(/Chrome\/(5[89]|6[012])/);

export {isChromeWithSelectionBug, buildPlugins, buildPluginKeymap, buildInputRules, registerPlugin, registerPreset, getPlugins}