const { limit } = require('./limit');
const { ping } = require('./spawn');
const { getText, getJSON, getDOM } = require('./fetch');
const { getColorFuncs } = require('../colors');
const { objectDebug } = require('../evaluate');
const { parseTime, formatTime } = require('./parse-time');
const { parseCommand } = require('../parse-command');
const { sudo } = require('./sudo');
const dateFns = require('date-fns');
const _ = require('lodash');
const { window } = (new (require('jsdom')).JSDOM(`<!DOCTYPE html><title></title>`));

function getContext({ print, notice, action, msgData, node }) {

    const trigger = node.get('trigger', '!');

    const IRC = {
        trigger,
        message: msgData,
        colors: getColorFuncs(trigger),
        nick: node.client.nick,
        channels: _.cloneDeep(node.client.chans),
        log: node.database.logFactory(msgData.target),
        commandFns: node.parent.database.commands.getCommandFns(),
        eventFns: node.database.eventFactory(msgData.from),
        resetBuffer: node.resetBuffer,
        webAddress: _.get(node, 'parent.web.url', '[unspecified]'),
        setEvent: (event) => {
            IRC.event = event;
            IRC.eventFns.addEvent = () => {
                throw new Error('cannot add an event in an event callback');
            };
        },
        setNick: (str) => {
            if (node.get('setnick-channels', []).includes(msgData.to)) {
                str = String(str).replace(/[^a-zA-Z0-9]+/g, '');
                node.client.send('NICK', str);
                return true;
            } else {
                return false;
            }
        },
        whois: node.client.whois,
        sudo: (callback) => { sudo({ IRC, callback, node, print }); },
        // command, require are patched later
    };

    const util = {
        ping,
        parseTime,
        parseCommand,
        objectDebug,
        breakHighlight: (s) => `${s.charAt(0)}\u200b${s.substring(1)}`,
    };

    const ctx = {
        print,
        notice,
        action,
        getText: limit(getText),
        getJSON: limit(getJSON),
        getDOM: limit(getDOM),
        IRC,
        util,
        setTimeout(...args) {
            return node.timeouts.push(setTimeout(...args));
        },
        setInterval(...args) {
            return node.intervals.push(setInterval(...args));
        },
        clearTimeout,
        clearInterval,
        dateFns,
        _: { ..._, delay: void 0, defer: void 0, debounce: void 0, throttle: void 0 },
        window,
        // store, input, acquire are patched later
    };

    return ctx;
}

module.exports = {
    getContext,
};
