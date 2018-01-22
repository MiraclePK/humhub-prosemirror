/*
 * @link https://www.humhub.org/
 * @copyright Copyright (c) 2017 HumHub GmbH & Co. KG
 * @license https://www.humhub.com/licences
 *
 */

import {icons, cmdItem, wrapItem} from "../../menu/menu"

function wrapBlockQuote(context) {
    return wrapItem(context.schema.nodes.blockquote, {
        title: "Wrap in block quote",
        icon: icons.blockquote,
        sortOrder: 700
    });
}

export function menu(context) {
    return [
        {
            id: 'wrapBlockQuote',
            node: 'blockquote',
            item: wrapBlockQuote(context)
        }
    ]
}