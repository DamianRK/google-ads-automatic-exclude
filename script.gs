//Configuration:
var EXCLUDE_QUERIES_WITHOUT = ["keyword1", "keyword2"];
var CAMPAIGN_LABEL = "your_campaign_label";
//End of the configuration

function main() {
    checkLabel();
    var campaignsIds = findShoppingIds();
  
    var badQueries = findBadQueries(campaignsIds);
    if (badQueries[0]) {
        Logger.log("The script adds " + badQueries.length + " new negative keywords...")
        addNegativeKeywordsToCampaign(badQueries)
    } else {
        Logger.log("All search queries meet your requirements.")
    }
}

function findShoppingIds() {
    var campaignsIds = [];
    var campaignsSelector = AdsApp.shoppingCampaigns()
        .withCondition("LabelNames CONTAINS_ANY ['" + CAMPAIGN_LABEL + "']")
        .withCondition("Status = ENABLED")
        .forDateRange("TODAY")
    var campaignsIterator = campaignsSelector.get();
    while (campaignsIterator.hasNext()) {
        var theCampaign = campaignsIterator.next();
        campaignsIds.push(theCampaign.getId());
    }
    return campaignsIds;
}

function findBadQueries(campaignIds) {
    var badQueries = [];
    var report = AdsApp.report(
        'SELECT Query,Clicks,Impressions,Cost,Conversions,CampaignId ' +
        ' FROM SEARCH_QUERY_PERFORMANCE_REPORT ' +
        ' WHERE CampaignId IN [' + campaignIds.join(",") + '] ' +
        ' DURING YESTERDAY ');
    var rows = report.rows();
    while (rows.hasNext()) {
        var isItBadQuery = true;
        var row = rows.next();
        var query = row['Query'];
        var length = EXCLUDE_QUERIES_WITHOUT.length;
        while (length--) {
            if (query.toLowerCase().indexOf(EXCLUDE_QUERIES_WITHOUT[length].toLowerCase()) != -1) {
                isItBadQuery = false;
            }
        }
        if (isItBadQuery) {
            badQueries.push(row['Query']);
        }
    }
    return badQueries;
}

function addNegativeKeywordsToCampaign(badQueries) {
    var campaignIterator = AdsApp.shoppingCampaigns()
        .withCondition("LabelNames CONTAINS_ANY ['" + CAMPAIGN_LABEL + "']")
        .get();
    if (campaignIterator.hasNext()) {
        var campaign = campaignIterator.next();
        Logger.log("Selected campaign: " + campaign.getName());
        badQueries.forEach(function(badQuery) {
            campaign.createNegativeKeyword('[' + badQuery + ']');
            Logger.log(badQuery + " --> added as an exact negatvie keyword");
        });
    }
}

function checkLabel() {
    var labelIterator = AdsApp.labels().withCondition("Name = '" + CAMPAIGN_LABEL + "'").get();
    if (!labelIterator.totalNumEntities()) {
        AdsApp.createLabel(CAMPAIGN_LABEL);
    }
}
