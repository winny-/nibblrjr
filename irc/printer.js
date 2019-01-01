const { objectDebug } = require('./evaluate');
const { parseColors } = require('./colors');

const messageFactory = (type, node, msgData) => {
    const { client } = node;
    const { target: defaultTarget } = msgData;
    let count = 0;

    // raw
    const sendRaw = (text, { target = defaultTarget, log = true } = {}) => {
        if (!msgData.from === '#8bitvape' && target !== defaultTarget) {
            throw new Error('nope');
        }
        // usage limit of 100 per command, only send if correctly connected to server and not to services
        if (++count > 100 || !node.registered || String(target).toLowerCase().includes('serv')) return;
        if (typeof text != 'string') {
            text = String(text);
        }
        if (!node.get('colors', true)) {
            text = text.replace(/(\x03\d{0,2}(,\d{0,2}|\x02\x02)?|\x0f|\x07|\x1D|\x02|\x1f)/g, '');
        }
        // strip out \r, fixes; print.raw(`${String.fromCharCode(13)}QUIT`)
        text = text.replace(/\r/g, '\n');

        client[type](target, text);

        // log to DB
        if (!msgData.isPM && log) {
            // lag a little so messages are the right order
            setTimeout(() => {
                node.database.log({
                    nick: node.client.nick,
                    command: type == 'notice' ? 'NOTICE' : 'PRIVMSG',
                    target,
                    args: [target || defaultTarget, ...text.split(' ')],
                });
            }, 200);
        }
    };

    // colours
    const send = (text, config) => {
        return sendRaw(parseColors(text), config);
    };

    send.raw = sendRaw;

    // inspect
    send.log = (text, config = {}) => {
        const { depth, colors } = config;
        return sendRaw(objectDebug(text, { depth, colors}), config);
    };

    return send;
};

const printFactory = (node, msgData) => {
    return messageFactory('say', node, msgData);
};
const noticeFactory = (node, msgData) => {
    return messageFactory('notice', node, msgData);
};

const actionFactory = (node, msgData) => {
    return messageFactory('action', node, msgData);
};


module.exports = {
    printFactory,
    noticeFactory,
    actionFactory,
};
