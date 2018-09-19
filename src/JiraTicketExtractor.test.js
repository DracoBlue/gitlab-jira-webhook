var JiraTicketExtractor = require('./JiraTicketExtractor');
var jiraTicketExtractor = new JiraTicketExtractor();

test('parse without match', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "feature/we-did-things",
        "mergeTitle": "We did things",
        "mergeDescription": "There has been lots of things to do.",
    });
    expect(ticketIds).toEqual([
    ]);
});

test('parse from source_branch', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "feature/TEST-123-we-did-things",
        "mergeTitle": "We did things",
        "mergeDescription": "There has been lots of things to do.",
    });
    expect(ticketIds).toEqual([
        "TEST-123"
    ]);
});

test('parse from title', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "finally-fix-fix",
        "mergeTitle": "Finally fix TEST-123 and TEST-125",
        "mergeDescription": "There has been lots of things to do.",
    });
    expect(ticketIds).toEqual([
        "TEST-123",
        "TEST-125"
    ]);
});

test('parse from description', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "finally-fix-fix",
        "mergeTitle": "Finally fix",
        "mergeDescription": "There has been work for TEST-123 and TEST-125 to do.",
    });
    expect(ticketIds).toEqual([
        "TEST-123",
        "TEST-125"
    ]);
});

test('parse from description, title and sourceBranch', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "finally-TEST-555-fix-fix",
        "mergeTitle": "Finally fix TEST-666",
        "mergeDescription": "There has been work for TEST-123 and TEST-125 to do.",
    });
    expect(ticketIds).toEqual([
        "TEST-555",
        "TEST-666",
        "TEST-123",
        "TEST-125",
    ]);
});

test('unique parse from description, title and sourceBranch', () => {
    var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent({
        "sourceBranch": "finally-TEST-555-fix-fix",
        "mergeTitle": "Finally fix TEST-666",
        "mergeDescription": "There has TEST-555 been work for TEST-123 and TEST-125 to do.",
    });
    expect(ticketIds).toEqual([
        "TEST-555",
        "TEST-666",
        "TEST-123",
        "TEST-125",
    ]);
});