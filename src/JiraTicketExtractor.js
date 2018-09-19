var debug = require('debug')('bridge:JiraTicketExtractor');

class JiraTicketExtractor {

    constructor () {
        debug('created')
    }

    getTicketIdsFromEvent (event) {
        debug('getTicketIdsFromEvent')
        var ticketIds = [];

        var rawString = " " + [
            event.sourceBranch,
            event.mergeTitle,
            event.mergeDescription
        ].join(" ") + " ";

        var matches = rawString.match(/([A-Z][A-Z]+\-\d+)/g);

        return [ ...new Set(matches || [])];
    }

}

module.exports = JiraTicketExtractor;