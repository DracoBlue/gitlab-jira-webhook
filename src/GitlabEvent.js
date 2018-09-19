var debug = require('debug')('bridge:GitlabEvent');


class GitlabEvent {

    constructor () {
        debug('created')
    }

    parseEvent (rawEvent) {
        debug('print')
    }

}

module.exports = GitlabEvent;