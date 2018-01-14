/*
 * @link https://www.humhub.org/
 * @copyright Copyright (c) 2017 HumHub GmbH & Co. KG
 * @license https://www.humhub.com/licences
 *
 */

import {MarkdownParser} from "prosemirror-markdown"
import {getPlugins, PresetManager} from "../core/plugins"
import {getRenderer} from "./renderer"
import {getSchema} from "../core/schema"

let presets = new PresetManager({
    name: 'parser',
    create: (options) => {
        return createParser(options);
    }
});

let getParser = (options = {}) => {
    return presets.check(options);
};

let createParser = (options) => {
    const plugins = getPlugins(options);

    let tokens = {};
    plugins.forEach((plugin) => {
        if (!plugin.schema) {
            return;
        }

        let schemaSpecs = Object.assign({}, plugin.schema.nodes || {}, plugin.schema.marks || {});

        for (let key in schemaSpecs) {
            let spec = schemaSpecs[key];
            if (spec.parseMarkdown) {

                if(spec.parseMarkdown.block || spec.parseMarkdown.node || spec.parseMarkdown.mark || spec.parseMarkdown.ignore) {
                    tokens[key] = spec.parseMarkdown;
                } else {
                    let tokenKey = Object.keys(spec.parseMarkdown)[0];
                    tokens[tokenKey] = spec.parseMarkdown[tokenKey]
                }
            }
        }
    });

    return new MarkdownParser(options.schema || getSchema(options), getRenderer(options), tokens);
};

export {getParser}