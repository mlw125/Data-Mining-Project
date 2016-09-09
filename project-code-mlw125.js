/**
 * Created by Matthew Williams on 3/31/2016.
 */

// debug variable to say when the sample data should be used
var DEBUG = false;

// holds the results from google
var searchItems;
// gets the index of a result when checked
var checkIndex = [];
// the list of results that can be manipulated
var reorderedResults = [];
// the list of results as they are originally found
var reorderedResultsOrig = [];

// creates a url string to send to google
function urlConcat(searchText)
{
    var part1 = "https://www.googleapis.com/customsearch/v1?";
    var part2 = "&q=" + searchText;
    var part3 = "&cx=004254893213773670373:1ibjy-kyfvu";
    var part4 = "&key=AIzaSyBno0e-gTcb_1ikxCQrnvvv9Q9DDoPpjOo";
    return part1 + part4 + part3 + part2
} // end urlConcat()

// used in sending and receiving from google
function reqListener() {
    console.log(this.responseText);
}

// on the loading of the page
window.onload = function(){
    document.getElementById('searchButton').onclick = function(){
        // clear all the data in the results section
        document.getElementById("results").innerHTML = "";
        document.getElementById("results2").innerHTML = "";

        // make sure the indices are cleared
        checkIndex.length = 0;

        // get the search query
        var query = document.getElementById('query').value;

        // get the google url with the search query added to it
        var data = urlConcat(query);
        // if we are not in debug mode, to test using searches
        if (DEBUG == false) {
            // create a new http request and send the url
            var xhttp = new XMLHttpRequest();
            xhttp.addEventListener("load", reqListener);

            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    resultsDisplay(xhttp.responseText);
                } // end if
            }; // end onreadystatechange
            xhttp.open("GET", data, true);
            xhttp.send();
        } // end if
        else
            resultsDisplay(sample_res); // end else
    }; // end onclick for 'searchButton'
    // when the button 'rerank' is pressed
    document.getElementById('rerank').onclick = function() {
        // clear the resorted results
        document.getElementById("results2").innerHTML = "";
        // reset the array that will move indices
        reorderedResults = reorderedResultsOrig.slice(0);

        // if the user wants to do jaccard similarity
        if(document.getElementById("modifiers").selectedIndex == "2") {
            jaccard();
        } // end if
        // if the user wants to do cosine similarity
        else {
            tf();
        } // end else
    };// end onclick for 'rerank'
}; // end window.onload()

function createAlerts(theCheckbox) {
    // when the check box is checked
    if (theCheckbox.checked == true) {
        // check to make sure we have not reached past 5 items
        if(checkIndex.length < 5) {
            // convert checkbox id (same as search result index) to integer
            var index = parseInt(theCheckbox.id);
            // push the index onto an array that holds indices
            checkIndex.push(index);
        } // end if
        // otherwise, tell the user and do not add the item
        // also set the checkbox to false which will throw the following function
        else
        {
            alert("Too many checks");
            theCheckbox.checked = false;
        } // end else
    }
    // when the checkbox is checked off
    if (theCheckbox.checked == false) {
        // remove the id from the array of indices
        var number = parseInt(theCheckbox.id);
        for(var i = checkIndex.length - 1; i >= 0; i--) {
            if(checkIndex[i] == number) {
                checkIndex.splice(i, 1);
            } // end if
        } // end for
    } // end if
} // end createAlerts()

function resultsDisplay(response) {
    var arr;

    // if we are using real results
    if(DEBUG == false) {
        // parse the data from google from a JSON
        arr = JSON.parse(response);
        searchItems = arr;
    } // end if
    // we are using the test results
    else {
        arr = response;
        searchItems = arr;
    } // end else

    var tempArray = [];
    for(var x = 0; x < searchItems.items.length; x++) {
        tempArray.push(x);
    }
    reorderedResultsOrig = tempArray.slice(0);

    // loop through all the returned results and display them for the user
    for(var i = 0; i < arr.items.length; i++) {
        var checkBox = createCheckBox(i);
        var tmp = document.createElement("div");
        tmp.appendChild(checkBox);
        checkBox = tmp.innerHTML;
        var results = document.createElement("div");
        results.innerHTML = "<br><div>" + checkBox +
            "<a href=" + arr.items[i].link + ">" + arr.items[i].htmlTitle + "</a></div>" +
            "<p><cite>" + arr.items[i].htmlFormattedUrl + "</cite></p>" +
            "<div>" + arr.items[i].htmlSnippet + "</div>";
        document.getElementById("results").appendChild(results);
    } // end for
} // end resultsDisplay(response)

// creates a checkbox with an id the same as the search result's index in the array.
function createCheckBox(id) {
    var checkBox = document.createElement("INPUT");
    checkBox.setAttribute("type", "checkbox");
    id = id.toString();
    checkBox.setAttribute("id", id);
    checkBox.setAttribute("onclick", "createAlerts(this)");
    return checkBox;
} // end createCheckBox(id)

// the document frequency
function tf() {
    // loop through all the values in checkIndex and
    // get the title and snippet, strip them down and put them into an another string
    var documentArray = "";
    for(var x = 0; x < checkIndex.length; x++) {
        var index = checkIndex[x];
        var title = searchItems.items[index].title;
        var snippet = searchItems.items[index].snippet;

        // combine into one document string
        documentArray += title + " " + snippet + " ";
    } // end for

    // preprocess the document
    documentArray = preprocess(documentArray);
    // array to hold all the words
    var dictionaryString = [];
    // hold the count of each word
    var dictionaryCount = [];
    // check each word in the array andget the term frequency, skipping it if it appears again after
    // the count is obtained.
    for(var y = 0; y < documentArray.length; y++) {
        var counter = 1;
        var indexOf = documentArray.indexOf(documentArray[y]);
        if(indexOf >= y) {
            for (var z = y + 1; z < documentArray.length; z++) {
                if (documentArray[z] == documentArray[y]) {
                    counter++;
                } // end if
            } // end for
            if (counter == 0) {
                dictionaryCount.push(1);
            } // end if
            else {
                dictionaryCount.push(counter);
            } // end else
        } // end if
    } // end for

    // need to normalize count
    normalize(dictionaryCount);
} // end tdf()

function preprocess(strDoc) {
    var strArray;
    // only runs if the user doesn't selects "NO Preprocessing"
    if(document.getElementById("modifiers").selectedIndex != "1") {
        strDoc = strDoc.replace(/[^\w\s]/gi, '');
        strDoc = strDoc.toLowerCase();
        strArray = strDoc.split(" ");

        // remove whitespace in the strings
        for(var x = 0; x < strArray.length; x++) {
            strArray[x] = strArray[x].trim();
        } // end for

        // loop through all the results and modify them for comparisons.
        for (var word = 0; word < strArray.length; word++) {
            // if the value is a numeric
            if (!isNaN(parseFloat(strArray[word])) && isFinite(strArray[word])) {
                strArray[word] = strArray[word].toString();
            } // end if
            else {
                if (document.getElementById("modifiers").selectedIndex != "0") {
                    for (var x = 0; x < stopWords.length; x++) {
                        if (stopWords[x] == strArray[word]) {
                            strArray.splice(x, 1);
                        } // end if
                    } // end for
                } // end if
            } // end else
        } // end for
        // this will call porter's algorithm to modify the strings, only when no porter's
        // is selected
        if(document.getElementById("modifiers").selectedIndex != "4") {
            for (var index = 0; index < strArray.length; index++) {
                strArray[index] = stemmer(strArray[index]);
            } // end for
        } // end if
    } // end if
    // for no preprocessing
    else {
        strArray = strDoc.split(" ");
    } // end else

    return strArray;
} // end preprocess()

function normalize(dictionaryCount){
    // array to hold the normalized data (tf / sum of tf)
    var dictionaryCountNorm = [];

    for (var y = 0; y < dictionaryCount.length; y++) {
        // simply to make the code little more readable
        dictionaryCountNorm.push(dictionaryCount[y] / dictionaryCount.length);
    } // end for

    cosineSimilarity(dictionaryCountNorm);
} // normalize()

function cosineSimilarity(dictionaryCountNorm) {
    var cosineArray = [];
    // loop through every result from google
    for(var x = 0; x < reorderedResults.length; x++) {
        // get the normalized count vector of each result
        var documentVector = findVector(reorderedResults[x]);

        // get the norm of the result
        var total = 0;
        for(var docIndex = 0; docIndex < documentVector.length; docIndex++) {
            total += Math.pow(documentVector[docIndex], 2);
        } // end for
        var resultNorm = Math.sqrt(total);

        // get the norm of the document
        var docTotal = 0;
        for(var w = 0; w < dictionaryCountNorm.length; w++) {
            // this will be the normalized tf from the documents
            docTotal += Math.pow(dictionaryCountNorm[w], 2);
        } // end for
        var docNorm = Math.sqrt(docTotal);

        // get the cosine similarity
        var cosineSimilarity;
        // dotProduct(query tf, document query tf) / ||Query|| * ||Document x||
        cosineSimilarity = dotProduct(documentVector, dictionaryCountNorm) / (resultNorm * docNorm);
        cosineArray.push(cosineSimilarity);
    } // end for

    // now to display the results in their new order.
    displayReRank(cosineArray);
} // end cosineSimilarity()

function dotProduct(documentNormalize, dictionaryCountNorm) {
    // find the dot product of the result and the document
    var total = 0;
    for(var x = 0; x < documentNormalize.length; x++) {
        if( x == dictionaryCountNorm.length) {
            break;
        }
        // sum of all the result(n) * document(n)
        total += documentNormalize[x] * dictionaryCountNorm[x];
    } // end for

    return total;
} // end dotProduct()

function findVector(index) {
    // get the title and string for the result and combine them
    var title = searchItems.items[index].title;
    var snippet = searchItems.items[index].snippet;
    // combine into one document, easier to just replace title
    var documentArray = title + " " + snippet + " ";

    // preprocess (or not) the string
    documentArray = preprocess(documentArray);

    var documentNormalize = [];
    // check each word in the array andget the term frequency, skipping it if it appears again after
    // the count is obtained.
    for(var y = 0; y < documentArray.length; y++) {
        var counter = 1;
        var indexOf = documentArray.indexOf(documentArray[y]);
        if(indexOf >= y) {
            for (var x = y + 1; x < documentArray.length; x++) {
                if (documentArray[x] == documentArray[y]) {
                    counter++;
                } // end if
            } // end for
            if (counter == 0) {
                documentNormalize.push(1);
            } // end if
            else {
                documentNormalize.push(counter);
            } // end else
        }
    } // end for

    for (var z = 0; z < documentNormalize.length; z++) {
        documentNormalize[z] = (documentNormalize[z] / documentNormalize.length);
    } // end for

    return documentNormalize;
} // end findVector()

function displayReRank(numbersArray) {
    // using bubble sort (i know)
    var len = numbersArray.length,
        i, j, stop;

    // this will also re-arrange the checked results so to display
    // them in decreasing order
    for (i=0; i < len; i++)  {
        for (j=0, stop=len-i; j < stop; j++) {
            if (numbersArray[j-1] > numbersArray[j]) {
                var temp = numbersArray[j];
                var temp2 = reorderedResults[j];
                numbersArray[j] = numbersArray[j-1];
                reorderedResults[j] = reorderedResults[j-1];
                numbersArray[j-1] = temp;
                reorderedResults[j-1] = temp2;
            } // end if
        } // end for
    } // end for

    // loop through the array that holds the index of each each search result ( now sorted) and
    // display them in descending order.
    for(var x = reorderedResults.length-1; x > -1; x--) {
        var index = parseInt(reorderedResults[x]);
        var results = document.createElement("div");
        results.innerHTML = "<br><div>" +
            "<a href=" + searchItems.items[index].link + ">" + searchItems.items[index].htmlTitle + "</a></div>" +
            "<p><cite>" + searchItems.items[index].htmlFormattedUrl + "</cite></p>" +
            "<div>" + searchItems.items[index].htmlSnippet + "</div>";
        document.getElementById("results2").appendChild(results);
    } // end for
    var decoration = document.createElement("hr");
    document.getElementById("results2").appendChild(decoration);
} // end displayReRank()

function jaccard() {
    // holds the strings from the title + snippet
    var resultDocument;

    // loop through all the values in checkIndex and
    // get the title and snippet, strip them down and put them into an array
    for(var x = 0; x < checkIndex.length; x++) {
        var index = checkIndex[x];
        var title = searchItems.items[index].title;
        var snippet = searchItems.items[index].snippet;

        // combine into one document, easier to just replace title
        resultDocument += title + " " + snippet + " ";
    }

    // preprocess the document
    var dictionaryString = preprocess(resultDocument);

    // temp arrays to hold data from each result
    var wordString = [];

    // find each word and remove it if it appears twice.
    for(var y = 0; y < dictionaryString.length; y++) {
        var index2 = wordString.indexOf(dictionaryString[y]);
        if(index2 == -1) {
            wordString.push(dictionaryString[y]);
        } // end if
    } // end for

    // need to compare the sets now.
    jaccardCompare(wordString);
} // end jaccard()

function jaccardCompare(dictionaryString) {
    // array to hold all the jaccard coefficients
    var jaccardCoefficients = [];
    // loops through every document to compare them to the document set
    for (var y = 0; y < reorderedResultsOrig.length; y++) {
        var title = searchItems.items[reorderedResultsOrig[y]].title;
        var snippet = searchItems.items[reorderedResultsOrig[y]].snippet;
        var documentArray = title + " " + snippet;
        documentArray = preprocess(documentArray);

        // find the intersection of the document set and each result.
        var intersection = getIntersection(documentArray, dictionaryString);
        // find the union of the document set and each result.
        var union = getUnion(documentArray, dictionaryString);
        // calculate the jaccard coefficient
        jaccardCoefficients.push(intersection.length / union.length);
    } // end for
    displayReRank(jaccardCoefficients);
} // end jaccardCompare()

function getIntersection(documentArray, dictionaryString) {
    var intersection = [];
    // find everything the query and the documents have in common
    for (var x = 0; x < documentArray.length; x++) {
        for (var y = 0; y < dictionaryString.length; y++) {
            if (documentArray[x] == dictionaryString[y]) {
                intersection.push(documentArray[x]);
            } // end if
        } // end for
    } // end for
    return intersection;
} // end getIntersection

function getUnion(documentArray, dictionaryString) {
    // set the union to the document array passed
    var union = dictionaryString;
    // loop through each string in the current document
    for (var x = 0; x < documentArray.length; x++) {
        var found = false;
        // loop through each string in the document
        for (var y = 0; y < union.length; y++) {
            // if the string from the document is found in the document set, then
            // set found to true and break from the nested for loop
            if (documentArray[x] == union[y]) {
                found = true;
                break;
            } // end if
        } // end for
        // if the string is not found, then we will add it to the union array.
        if (found == false) {
            union.push(documentArray[x]);
        } // end if
    } // end for
    return union;
} // end getUnion

// list of all/most/many stop words
var stopWords = ["a", "about", "above", "above", "across", "after",
    "afterwards", "again", "against", "all", "almost", "alone", "along",
    "already", "also","although","always","am","among", "amongst",
    "amoungst", "amount",  "an", "and", "another", "any","anyhow","anyone",
    "anything","anyway", "anywhere", "are", "around", "as",  "at", "back",
    "be","became", "because","become","becomes", "becoming", "been",
    "before", "beforehand", "behind", "being", "below", "beside",
    "besides", "between", "beyond", "bill", "both", "bottom","but",
    "by", "call", "can", "cannot", "cant", "co", "con", "could",
    "couldnt", "cry", "de", "describe", "detail",  "do", "does", "done",  "down",
    "due", "during", "each", "eg", "eight", "either", "eleven","else",
    "elsewhere", "empty", "enough", "etc", "even", "ever", "every",
    "everyone", "everything", "everywhere", "except", "few", "fifteen",
    "fify", "fill", "find", "fire", "first", "five", "for", "former",
    "formerly", "forty", "found", "four", "from", "front", "full",
    "further", "get", "give", "go", "had", "has", "hasnt", "have",
    "he", "hence", "her", "here", "hereafter", "hereby", "herein",
    "hereupon", "hers", "herself", "him", "himself", "his", "how",
    "however", "hundred", "ie", "if", "in", "inc", "indeed",
    "interest", "into", "is",  "it", "its", "itself", "keep",
    "last", "latter", "latterly", "least", "less", "ltd", "made",
    "many", "may", "me", "meanwhile", "might", "mill", "mine",
    "more", "moreover", "most", "mostly", "move", "much", "must", "my",
    "myself", "name", "namely", "neither", "never", "nevertheless", "next",
    "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now",
    "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto",
    "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out",
    "over", "own","part", "per", "perhaps", "please", "put", "rather", "re",
    "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several",
    "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so",
    "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere",
    "still", "such", "system", "take", "ten", "than", "that", "the", "their", "them",
    "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore",
    "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this",
    "those", "though", "three", "through", "throughout", "thru", "thus", "to",
    "together", "too", "top", "toward", "towards", "twelve", "twenty", "two",
    "un", "under", "until", "up", "upon", "us", "very", "via", "was", "way", "we",
    "well", "were", "what", "whatever", "when", "whence", "whenever", "where",
    "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever",
    "whether", "which", "while", "whither", "who", "whoever", "whole", "whom",
    "whose", "why", "will", "with", "within", "without", "would", "yet", "you",
    "your", "yours", "yourself", "yourselves", "the",
    "didnt", "doesnt", "dont", "isnt", "wasnt", "youre", "hes", "ive", "theyll",
    "whos", "wheres", "whens", "whys", "hows", "whats", "were", "shes", "im", "thats"
];

// sample data the test when reaching search limit
var sample_res = {
    "kind": "customsearch#search",
    "url": {
        "type": "application/json",
        "template": "https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&lr={language?}&safe={safe?}&cx={cx?}&cref={cref?}&sort={sort?}&filter={filter?}&gl={gl?}&cr={cr?}&googlehost={googleHost?}&c2coff={disableCnTwTranslation?}&hq={hq?}&hl={hl?}&siteSearch={siteSearch?}&siteSearchFilter={siteSearchFilter?}&exactTerms={exactTerms?}&excludeTerms={excludeTerms?}&linkSite={linkSite?}&orTerms={orTerms?}&relatedSite={relatedSite?}&dateRestrict={dateRestrict?}&lowRange={lowRange?}&highRange={highRange?}&searchType={searchType}&fileType={fileType?}&rights={rights?}&imgSize={imgSize?}&imgType={imgType?}&imgColorType={imgColorType?}&imgDominantColor={imgDominantColor?}&alt=json"
    },
    "queries": {
        "nextPage": [
            {
                "title": "Google Custom Search - Diablo III",
                "totalResults": "2080000",
                "searchTerms": "Diablo III",
                "count": 10,
                "startIndex": 11,
                "inputEncoding": "utf8",
                "outputEncoding": "utf8",
                "safe": "high",
                "cx": "002134577085451877840:sgvhapz4hy0"
            }
        ],
        "request": [
            {
                "title": "Google Custom Search - Diablo III",
                "totalResults": "2080000",
                "searchTerms": "Diablo III",
                "count": 10,
                "startIndex": 1,
                "inputEncoding": "utf8",
                "outputEncoding": "utf8",
                "safe": "high",
                "cx": "002134577085451877840:sgvhapz4hy0"
            }
        ]
    },
    "context": {
        "title": "dataMiningProject-4315"
    },
    "searchInformation": {
        "searchTime": 0.201037,
        "formattedSearchTime": "0.20",
        "totalResults": "2080000",
        "formattedTotalResults": "2,080,000"
    },
    "items": [
        {
            "kind": "customsearch#result",
            "title": "Diablo III Official Game Site",
            "htmlTitle": "<b>Diablo III</b> Official Game Site",
            "link": "http://us.battle.net/d3/en/",
            "displayLink": "us.battle.net",
            "snippet": "The demonically-besieged world of Sanctuary needs heroes. Will you heed the \ncall? Diablo III is an action role-playing game from Blizzard Entertainment for the\n ...",
            "htmlSnippet": "The demonically-besieged world of Sanctuary needs heroes. Will you heed the <br>\ncall? <b>Diablo III</b> is an action role-playing game from Blizzard Entertainment for the<br>\n&nbsp;...",
            "cacheId": "OY9HlbGUQ_MJ",
            "formattedUrl": "us.battle.net/d3/en/",
            "htmlFormattedUrl": "us.battle.net/d3/en/",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://media.blizzard.com/battle.net/logos/og-d3.png"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "78",
                        "height": "78",
                        "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd4zzLaQUD6nsWJy2A_NzZDGodfzXk7yDTPAaZpjB2udFMtqOchRFc"
                    }
                ],
                "sitenavigationelement": [
                    {
                        "url": "Home",
                        "name": "Home"
                    },
                    {
                        "url": "Game Guide",
                        "name": "Game Guide"
                    },
                    {
                        "url": "Rankings",
                        "name": "Rankings"
                    },
                    {
                        "url": "Media",
                        "name": "Media"
                    },
                    {
                        "url": "Forums",
                        "name": "Forums"
                    },
                    {
                        "url": "Buy Now",
                        "name": "Buy Now"
                    },
                    {
                        "url": "Diablo III",
                        "name": "Diablo III"
                    }
                ],
                "metatags": [
                    {
                        "twitter:card": "summary",
                        "twitter:title": "Diablo III Official Game Site",
                        "twitter:description": "The demonically-besieged world of Sanctuary needs heroes. Will you heed the call? Diablo III is an action role-playing game from Blizzard Entertainment for the PC and Mac.",
                        "fb:app_id": "155068716934",
                        "og:site_name": "Diablo III",
                        "og:locale": "en_US",
                        "og:type": "website",
                        "og:url": "http://us.battle.net/d3/en/",
                        "og:image": "http://media.blizzard.com/battle.net/logos/og-d3.png",
                        "og:title": "Diablo III",
                        "og:description": "The demonically-besieged world of Sanctuary needs heroes. Will you heed the call? Diablo III is an action role-playing game from Blizzard Entertainment for the PC and Mac."
                    }
                ],
                "blogposting": [
                    {
                        "headline": "Patch 2.4.1 PTR Patch Notes",
                        "description": "Below you'll find the preliminary PTR patch notes for patch 2.4.1. Please note that this isn't the final version of the patch notes and that some changes may not be documented or described...",
                        "datepublished": "2016-03-22T11:00:00-07:00",
                        "datemodified": "2016-03-22T12:48:45-07:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:435",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/CVJE4MKAOSVK1403660029772.jpg"
                    },
                    {
                        "headline": "Once More unto the Breach – Adventuring with Kanai",
                        "description": "The spectral form of Chief Elder Kanai rises from his seat and beckons you to follow him as he opens up a mysterious portal. For the month of March, those who pay their respects to Elder Chief...",
                        "datepublished": "2016-03-22T10:00:00-07:00",
                        "datemodified": "2016-03-22T10:00:00-07:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:23",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/jh/JHZ6VP08K6WI1457745947671.jpg"
                    },
                    {
                        "headline": "Diablo III: Reaper of Souls Anniversary Giveaway Now Live!",
                        "description": "On March 25, 2014, the Angel of Death descended on Westmarch to wreak havoc. Join the celebration and win 1 of 30 gift bundles and receive 20% off your next purchase on the Blizzard Gear store!",
                        "datepublished": "2016-03-18T10:09:00-07:00",
                        "datemodified": "2016-03-21T10:03:25-07:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:182",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/79/79KJJQQPCOYS1457741404803.jpg"
                    },
                    {
                        "headline": "Developer Insights: Legendary Gem Updates",
                        "description": "In Patch 2.4.1, we’ll be making notable changes to a handful of Legendary Gems. Join us on this deep dive into the design structure behind Legendary Gems.",
                        "datepublished": "2016-03-17T10:00:00-07:00",
                        "datemodified": "2016-03-17T10:00:00-07:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:151",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/16/16OS125H4RWC1457742283979.jpg"
                    },
                    {
                        "headline": "Patch 2.4.1 PTR Now Available",
                        "description": "Patch 2.4.1 is currently in development and now available for testing on the PTR. We’re also experimenting with some server performance optimizations, and we need you to join us on the PTR...",
                        "datepublished": "2016-03-08T12:00:00-08:00",
                        "datemodified": "2016-03-18T13:01:23-07:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:165",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/69984JTA15YR1403718655580.jpg"
                    },
                    {
                        "headline": "BlizzCon 2015's Lightning Talks Now Live!",
                        "description": "You may have noticed that, over the past several weeks, we’ve released a few new videos on our YouTube channel. If you haven’t, you’re in for a treat—we’ve recorded new versions of...",
                        "datepublished": "2016-03-01T10:00:00-08:00",
                        "datemodified": "2016-03-02T00:15:24-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:63",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/2t/2TV4THH7HGSH1456768768957.jpg"
                    },
                    {
                        "headline": "Developer Insights: Set Dungeons",
                        "description": "Patch 2.4.0 (and Season 5) introduces one of Diablo III’s newest and most exciting features yet: Set Dungeons. What was the design intent behind these formidable new challenges? We’ve prepared...",
                        "datepublished": "2016-02-05T10:00:00-08:00",
                        "datemodified": "2016-02-05T10:21:38-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:526",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/jz/JZ3GXDGJSVJ71454454837751.jpg"
                    },
                    {
                        "headline": "Season Rebirth Mail Expiring Soon",
                        "description": "If you jumped into Season 5 using Patch 2.4.0’s new Season Rebirth feature, it’s possible that your items may be on their way out the door! As we rapidly approach thirty days into the latest...",
                        "datepublished": "2016-02-03T10:00:00-08:00",
                        "datemodified": "2016-02-05T11:45:37-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:46",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/r2/R2F9191AZ3BV1454377660593.png"
                    },
                    {
                        "headline": "Engineering Diablo III's Damage Numbers",
                        "description": "To work in software development is to know that simple problems don’t always have simple solutions. This in-depth, under-the-hood look at the deceptively \"simple\" Patch 2.4.0 revision of...",
                        "datepublished": "2016-01-22T10:00:00-08:00",
                        "datemodified": "2016-02-05T11:45:29-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:595",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/ff/FFFRICA2MHF71453327017302.jpg"
                    },
                    {
                        "headline": "Season 5 Now Live",
                        "description": "Diablo III Season 5 is now live in all gameplay regions!",
                        "datepublished": "2016-01-15T17:00:00-08:00",
                        "datemodified": "2016-01-29T11:23:41-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:274",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/ai/AIZ4LIPMBEH21450310664378.jpg"
                    },
                    {
                        "headline": "Patch 2.4.0 Now Live",
                        "description": "Diablo III patch 2.4.0 is now live in the Americas! Read on to read about the latest changes.",
                        "datepublished": "2016-01-12T11:25:00-08:00",
                        "datemodified": "2016-01-12T15:09:34-08:00",
                        "inlanguage": "en-US",
                        "interactioncount": "UserComments:455",
                        "thumbnailurl": "//bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/pz/PZ2Z8XVG4OH91446515023224.jpg"
                    }
                ],
                "blog": [
                    {
                        "url": "Patch 2.4.1 PTR Patch Notes Below you'll find the preliminary PTR patch notes for patch 2.4.1. Please note that this isn't the final version of the patch notes and that some changes may not..."
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Blizzard Entertainment:Diablo III",
            "htmlTitle": "Blizzard Entertainment:<b>Diablo III</b>",
            "link": "http://us.blizzard.com/games/d3/",
            "displayLink": "us.blizzard.com",
            "snippet": "Twenty years have passed since the Prime Evils were defeated and banished \nfrom the world of Sanctuary. Now, you must return to where it all began – the \ntown ...",
            "htmlSnippet": "Twenty years have passed since the Prime Evils were defeated and banished <br>\nfrom the world of Sanctuary. Now, you must return to where it all began – the <br>\ntown&nbsp;...",
            "cacheId": "_kowr5vIlYEJ",
            "formattedUrl": "us.blizzard.com/games/d3/",
            "htmlFormattedUrl": "us.blizzard.com/games/d3/",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://us.blizzard.com/static/_images/games/videos/d3_youtube-reveal_t.jpg"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "118",
                        "height": "49",
                        "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShNpSfGEgnUpYtur-hmcHgSLUEa_xkuN0PiFi6tD1nQkdQihtpcdBn"
                    }
                ],
                "metatags": [
                    {
                        "og:image": "/static/_images/games/d3/diablo_ad_110x117_logo.jpg"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Diablo III - Wikipedia, the free encyclopedia",
            "htmlTitle": "<b>Diablo III</b> - Wikipedia, the free encyclopedia",
            "link": "https://en.wikipedia.org/wiki/Diablo_III",
            "displayLink": "en.wikipedia.org",
            "snippet": "Diablo III is an action role-playing video game developed and published by \nBlizzard Entertainment. It is the third installment in the Diablo franchise and was ...",
            "htmlSnippet": "<b>Diablo III</b> is an action role-playing video game developed and published by <br>\nBlizzard Entertainment. It is the third installment in the Diablo franchise and was&nbsp;...",
            "cacheId": "25UGQx0qFi4J",
            "formattedUrl": "https://en.wikipedia.org/wiki/Diablo_III",
            "htmlFormattedUrl": "https://en.wikipedia.org/wiki/<b>Diablo</b>_<b>III</b>",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "https://upload.wikimedia.org/wikipedia/en/8/80/Diablo_III_cover.png"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "190",
                        "height": "265",
                        "src": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRW8akt-lc0KKlVC8F9P2-2iPey_uK6j0U9GAe4ek9__9_D5NHMEjfjd6c"
                    }
                ],
                "metatags": [
                    {
                        "referrer": "origin-when-cross-origin"
                    }
                ],
                "hproduct": [
                    {
                        "fn": "Diablo III"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Amazon.com: Diablo III - PC/Mac: Video Games",
            "htmlTitle": "Amazon.com: <b>Diablo III</b> - PC/Mac: Video Games",
            "link": "http://www.amazon.com/Diablo-III-PC-Mac/dp/B00178630A",
            "displayLink": "www.amazon.com",
            "snippet": "The Witch Doctor is a new character reminiscent of the Diablo II Necromancer; \nThe Barbarians will have a variety of revamped skills at their disposal based on ...",
            "htmlSnippet": "The Witch Doctor is a new character reminiscent of the <b>Diablo</b> II Necromancer; <br>\nThe Barbarians will have a variety of revamped skills at their disposal based on&nbsp;...",
            "cacheId": "UGhZ7HWLCp8J",
            "formattedUrl": "www.amazon.com/Diablo-III-PC-Mac/dp/B00178630A",
            "htmlFormattedUrl": "www.amazon.com/<b>Diablo</b>-<b>III</b>-PC-Mac/dp/B00178630A",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://ecx.images-amazon.com/images/I/81qVP4sKuGL._SY606_.jpg"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "189",
                        "height": "267",
                        "src": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRIAQJ2iS8FO8OveX3Ehs_5IBMDe-zWwm3Zd2PBqjqIx82ube-jEEF5qniX"
                    }
                ],
                "scraped": [
                    {
                        "image_link": "http://ecx.images-amazon.com/images/I/81qVP4sKuGL.jpg"
                    }
                ],
                "metatags": [
                    {
                        "title": "Amazon.com: Diablo III - PC/Mac: Video Games"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Diablo III - Diablo Wiki - Wikia",
            "htmlTitle": "<b>Diablo III</b> - Diablo Wiki - Wikia",
            "link": "http://diablo.wikia.com/wiki/Diablo_III",
            "displayLink": "diablo.wikia.com",
            "snippet": "Diablo III is an installment in the Diablo series. After years of rumors, the game \nwas officially announced on June 28, 2008 at 12.18 in the afternoon (CEST) at \nthe ...",
            "htmlSnippet": "<b>Diablo III</b> is an installment in the Diablo series. After years of rumors, the game <br>\nwas officially announced on June 28, 2008 at 12.18 in the afternoon (CEST) at <br>\nthe&nbsp;...",
            "cacheId": "iRcUVuqV-IwJ",
            "formattedUrl": "diablo.wikia.com/wiki/Diablo_III",
            "htmlFormattedUrl": "<b>diablo</b>.wikia.com/wiki/<b>Diablo</b>_<b>III</b>",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://vignette3.wikia.nocookie.net/diablo/images/6/6f/Diablo_Box_Art.jpg/revision/latest?cb=20111124094018"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "189",
                        "height": "267",
                        "src": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTtDER1LEZ80ZPb7ildRG9KRK6H4R1nzAAl2d9IWPrDxmQcRTrpD9v3vDk"
                    }
                ],
                "metatags": [
                    {
                        "viewport": "width=device-width, initial-scale=1.0, user-scalable=yes",
                        "twitter:card": "summary",
                        "twitter:site": "@Wikia",
                        "twitter:url": "http://diablo.wikia.com/wiki/Diablo_III",
                        "twitter:title": "Diablo III - Diablo Wiki - Wikia",
                        "twitter:description": "\"It has been said that in the end of all things, we would find a new beginning. But as the shadow once again crawls across our world and the stench of terror drifts on a bitter wind, people pray...",
                        "fb:app_id": "112328095453510",
                        "og:type": "article",
                        "og:site_name": "Diablo Wiki",
                        "og:title": "Diablo III",
                        "og:description": "\"It has been said that in the end of all things, we would find a new beginning. But as the shadow once again crawls across our world and the stench of terror drifts on a bitter wind, people pray for strength and guidance. They should pray for the mercy of a swift death... for I've seen what the Darkness hides.\" — Leah, narrating the cinematic trailer. Diablo III is an installment in the Diablo series. After years of rumors, the game was officially announced on June 28, 2008 at 12.18 in the...",
                        "og:url": "http://diablo.wikia.com/wiki/Diablo_III",
                        "og:image": "http://vignette3.wikia.nocookie.net/diablo/images/6/6f/Diablo_Box_Art.jpg/revision/latest?cb=20111124094018",
                        "apple-itunes-app": "app-id=422467074, app-arguments=http://diablo.wikia.com/wiki/Diablo_III"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Diablo III Products - Battle.net Shop",
            "htmlTitle": "<b>Diablo III</b> Products - Battle.net Shop",
            "link": "https://us.battle.net/shop/en/product/game/diablo",
            "displayLink": "us.battle.net",
            "snippet": "The Battle.net Shop has the latest Blizzard games, card packs, pets, mounts, in-\ngame services, Battle.net Balance, and more. Visit us today and get gaming!",
            "htmlSnippet": "The Battle.net Shop has the latest Blizzard games, card packs, pets, mounts, in-<br>\ngame services, Battle.net Balance, and more. Visit us today and get gaming!",
            "cacheId": "GHSEHe9AeiIJ",
            "formattedUrl": "https://us.battle.net/shop/en/product/game/diablo",
            "htmlFormattedUrl": "https://us.battle.net/shop/en/product/game/<b>diablo</b>",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "https://bnetus-a.akamaihd.net/shop/static/images/logos/og-shop-50646273ab.png"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "160",
                        "height": "160",
                        "src": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQ27Bd-_t_IAZpMSz2tb25ecMpxklW3yDHunCYYhMBUdERqu9Cgd035S56H"
                    }
                ],
                "metatags": [
                    {
                        "og:type": "website",
                        "og:title": "Diablo III Products - Battle.net Shop",
                        "og:image": "https://bnetus-a.akamaihd.net/shop/static/images/logos/og-shop-50646273ab.png",
                        "og:description": "The Battle.net Shop has the latest Blizzard games, card packs, pets, mounts, in-game services, Battle.net Balance, and more. Visit us today and get gaming!",
                        "og:url": "https://us.battle.net/shop/en/product/game/diablo",
                        "og:locale": "en_US",
                        "og:locale:alternate": "de_DE",
                        "viewport": "width=device-width"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "How Not To Play Diablo III",
            "htmlTitle": "How Not To Play <b>Diablo III</b>",
            "link": "http://kotaku.com/how-not-to-play-diablo-iii-1755499599",
            "displayLink": "kotaku.com",
            "snippet": "Jan 27, 2016 ... You might think that there's no “wrong” way to play a game like Diablo III. This is \nincorrect. Somehow, I figured out how to pull it off.",
            "htmlSnippet": "Jan 27, 2016 <b>...</b> You might think that there&#39;s no “wrong” way to play a game like <b>Diablo III</b>. This is <br>\nincorrect. Somehow, I figured out how to pull it off.",
            "cacheId": "KQGEEZ_ymYwJ",
            "formattedUrl": "kotaku.com/how-not-to-play-diablo-iii-1755499599",
            "htmlFormattedUrl": "kotaku.com/how-not-to-play-<b>diablo</b>-<b>iii</b>-1755499599",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "https://i.kinja-img.com/gawker-media/image/upload/s--h76gq7jc--/c_fill,fl_progressive,g_north,h_358,q_80,w_636/yjsq8ukhgizwt5lpddht.png"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "299",
                        "height": "168",
                        "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmC50ngn5Pm9MFNArk2PxHTFl3Z28bLSp85tiUxhz6err4QVXhGeN4E-W"
                    }
                ],
                "metatags": [
                    {
                        "dynamic-stylesheet": "//x.kinja-static.com/assets/stylesheets/editor-a1ca4c208bc85cdf64d93e4ceecfa94c.css",
                        "viewport": "width=device-width, initial-scale=1.0, minimum-scale=1.0,maximum-scale=10.0",
                        "msapplication-square70x70logo": "https://i.kinja-img.com/gawker-media/image/upload/s--q13K9fyk--/c_fill,fl_progressive,g_center,h_80,q_80,w_80/ghxlwgdztvqerb4zptdx.png",
                        "msapplication-square150x150logo": "https://i.kinja-img.com/gawker-media/image/upload/s--XYjAnDao--/c_fill,fl_progressive,g_center,h_200,q_80,w_200/ghxlwgdztvqerb4zptdx.png",
                        "news_keywords": "diablo, diablo 3, kotakucore, blizzard, diablo iii, Kotaku",
                        "twitter:url": "http://kotaku.com/how-not-to-play-diablo-iii-1755499599",
                        "og:title": "How Not To Play Diablo III",
                        "og:type": "article",
                        "twitter:image": "https://i.kinja-img.com/gawker-media/image/upload/s--h76gq7jc--/c_fill,fl_progressive,g_north,h_358,q_80,w_636/yjsq8ukhgizwt5lpddht.png",
                        "og:image": "https://i.kinja-img.com/gawker-media/image/upload/s--h76gq7jc--/c_fill,fl_progressive,g_north,h_358,q_80,w_636/yjsq8ukhgizwt5lpddht.png",
                        "author": "Jason Schreier",
                        "og:url": "http://kotaku.com/how-not-to-play-diablo-iii-1755499599",
                        "twitter:card": "summary_large_image",
                        "twitter:site": "@kotaku",
                        "twitter:title": "How Not To Play Diablo III",
                        "og:description": "You might think that there’s no “wrong” way to play a game like Diablo III. This is incorrect. Somehow, I figured out how to pull it off.",
                        "twitter:description": "You might think that there’s no “wrong” way to play a game like Diablo III. This is incorrect. Somehow, I figured out how to pull it off.",
                        "og:locale": "en_US",
                        "og:site_name": "Kotaku",
                        "fb:app_id": "35737966741"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Console - Diablo III",
            "htmlTitle": "Console - <b>Diablo III</b>",
            "link": "http://battle.net/d3/console/",
            "displayLink": "battle.net",
            "snippet": "Over 15 million players have battled the demonic hordes of Diablo III.* Now, it's \nyour turn to join the crusade and take up arms against the enemies of the mortal ...",
            "htmlSnippet": "Over 15 million players have battled the demonic hordes of <b>Diablo III</b>.* Now, it&#39;s <br>\nyour turn to join the crusade and take up arms against the enemies of the mortal&nbsp;...",
            "cacheId": "kqV5Es5bfx4J",
            "formattedUrl": "battle.net/d3/console/",
            "htmlFormattedUrl": "battle.net/d3/console/",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://us.battle.net/d3/static/images/console/console-share.jpg"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "328",
                        "height": "154",
                        "src": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRdUoP4GOl6hlg8Y-Nrw9TARXNF-Qpkk4-igOXVNuILMBN3vAsbGOUO1IZN"
                    }
                ],
                "sitenavigationelement": [
                    {
                        "url": "Home",
                        "name": "Home"
                    },
                    {
                        "url": "Game Guide",
                        "name": "Game Guide"
                    },
                    {
                        "url": "Rankings",
                        "name": "Rankings"
                    },
                    {
                        "url": "Media",
                        "name": "Media"
                    },
                    {
                        "url": "Forums",
                        "name": "Forums"
                    },
                    {
                        "url": "Buy Now",
                        "name": "Buy Now"
                    },
                    {
                        "url": "Diablo III",
                        "name": "Diablo III"
                    },
                    {
                        "url": "Console",
                        "name": "Console"
                    }
                ],
                "metatags": [
                    {
                        "title": "Console",
                        "identifier": "console",
                        "type": "home",
                        "icon": "/d3/static/images/game/guide/icon-shield.png",
                        "language": "en-us",
                        "twitter:card": "summary",
                        "twitter:title": "Console - Diablo III",
                        "twitter:description": "Evil Reborn on Console",
                        "twitter:image:src": "http://us.battle.net/d3/static/images/console/console-share.jpg",
                        "fb:app_id": "155068716934",
                        "og:site_name": "Diablo III",
                        "og:locale": "en_US",
                        "og:type": "website",
                        "og:url": "http://us.battle.net/d3/console",
                        "og:image": "http://us.battle.net/d3/static/images/console/console-share.jpg",
                        "og:title": "Console - Diablo III",
                        "og:description": "Evil Reborn on Console"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Buy Diablo III - Diablo III",
            "htmlTitle": "Buy <b>Diablo III</b> - <b>Diablo III</b>",
            "link": "https://battle.net/d3/purchase",
            "displayLink": "battle.net",
            "snippet": "Diablo III for PC/Mac Buy Now! Diablo III on Console Learn More! Starter Edition \nTry It Free! Diablo III · Buy Diablo III · Support Feedback. Americas - English (US)\n ...",
            "htmlSnippet": "<b>Diablo III</b> for PC/Mac Buy Now! <b>Diablo III</b> on Console Learn More! Starter Edition <br>\nTry It Free! <b>Diablo III</b> &middot; Buy <b>Diablo III</b> &middot; Support Feedback. Americas - English (US)<br>\n&nbsp;...",
            "cacheId": "TFJ2pqWm3bsJ",
            "formattedUrl": "https://battle.net/d3/purchase",
            "htmlFormattedUrl": "https://battle.net/d3/purchase",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://media.blizzard.com/battle.net/logos/og-d3.png"
                    }
                ],
                "sitenavigationelement": [
                    {
                        "url": "Home",
                        "name": "Home"
                    },
                    {
                        "url": "Game Guide",
                        "name": "Game Guide"
                    },
                    {
                        "url": "Rankings",
                        "name": "Rankings"
                    },
                    {
                        "url": "Media",
                        "name": "Media"
                    },
                    {
                        "url": "Forums",
                        "name": "Forums"
                    },
                    {
                        "url": "Buy Now",
                        "name": "Buy Now"
                    },
                    {
                        "url": "Diablo III",
                        "name": "Diablo III"
                    },
                    {
                        "url": "Buy Diablo III",
                        "name": "Buy Diablo III"
                    }
                ],
                "metatags": [
                    {
                        "twitter:card": "summary",
                        "twitter:title": "Buy Diablo III - Diablo III",
                        "twitter:description": "Buy Diablo III - Diablo III",
                        "fb:app_id": "155068716934",
                        "og:site_name": "Diablo III",
                        "og:locale": "en_US",
                        "og:type": "website",
                        "og:url": "https://us.battle.net/d3/en/purchase",
                        "og:image": "http://media.blizzard.com/battle.net/logos/og-d3.png",
                        "og:title": "Diablo III",
                        "og:description": "Buy Diablo III - Diablo III"
                    }
                ]
            }
        },
        {
            "kind": "customsearch#result",
            "title": "Diablo III for PC Reviews - Metacritic",
            "htmlTitle": "<b>Diablo III</b> for PC Reviews - Metacritic",
            "link": "http://www.metacritic.com/game/pc/diablo-iii",
            "displayLink": "www.metacritic.com",
            "snippet": "Metacritic Game Reviews, Diablo III for PC, Diablo III picks up the story twenty \nyears after the events of Diablo II. Mephisto, Diablo, and Baal have been \ndefeated, ...",
            "htmlSnippet": "Metacritic Game Reviews, <b>Diablo III</b> for PC, <b>Diablo III</b> picks up the story twenty <br>\nyears after the events of Diablo II. Mephisto, Diablo, and Baal have been <br>\ndefeated,&nbsp;...",
            "cacheId": "Uj4HjQVXZtMJ",
            "formattedUrl": "www.metacritic.com/game/pc/diablo-iii",
            "htmlFormattedUrl": "www.metacritic.com/game/pc/<b>diablo</b>-<b>iii</b>",
            "pagemap": {
                "cse_image": [
                    {
                        "src": "http://static.metacritic.com/images/products/games/2/ee7a9ea1f4ec1470f5d97d2f418ab7f8-98.jpg"
                    }
                ],
                "organization": [
                    {
                        "url": "Blizzard Entertainment",
                        "name": "Blizzard Entertainment"
                    }
                ],
                "cse_thumbnail": [
                    {
                        "width": "78",
                        "height": "111",
                        "src": "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSdjpT38IEwT1krJ_lnZ7zHlZZKKchB92k5F-nt-gVXEF2WBKuYhldwDA"
                    }
                ],
                "aggregaterating": [
                    {
                        "bestrating": "100",
                        "ratingvalue": "88",
                        "reviewcount": "86"
                    }
                ],
                "softwareapplication": [
                    {
                        "applicationcategory": "Game",
                        "softwareapplicationcategory": "http://schema.org/GameApplication",
                        "name": "Diablo III",
                        "device": "PC",
                        "datepublished": "May 15, 2012",
                        "image": "http://static.metacritic.com/images/products/games/2/ee7a9ea1f4ec1470f5d97d2f418ab7f8-98.jpg",
                        "description": "Diablo III picks up the story twenty years after the events of Diablo II. Mephisto, Diablo, and Baal have been defeated, but the Worldstone, which once shielded the inhabitants of the world...",
                        "genre": "Role-Playing",
                        "contentrating": "M"
                    }
                ],
                "metatags": [
                    {
                        "viewport": "width=1024",
                        "application-name": "Metacritic",
                        "msapplication-tilecolor": "#000000",
                        "msapplication-tileimage": "/images/win8tile/76bf1426-2886-4b87-ae1c-06424b6bb8a2.png",
                        "og:title": "Diablo III",
                        "og:type": "game",
                        "og:url": "http://www.metacritic.com/game/pc/diablo-iii",
                        "og:image": "http://static.metacritic.com/images/products/games/2/ee7a9ea1f4ec1470f5d97d2f418ab7f8-98.jpg",
                        "og:site_name": "Metacritic",
                        "fb:app_id": "123113677890173",
                        "og:description": "Diablo III picks up the story twenty years after the events of Diablo II. Mephisto, Diablo, and Baal have been defeated, but the Worldstone, which once shielded the inhabitants of the world of Sanctuary from the forces of both the High Heavens and the Burning Hells, has been destroyed, and evil once again stirs in Tristram. Playing as a hero from one of five distinct character classes, players acquire powerful items, spells, and abilities as they explore new and familiar areas of Sanctuary and battle hordes of demons to safeguard the world from the horrors that have arisen. Diablo III features a custom 3D-graphics engine to render lush indoor and outdoor areas of Sanctuary with a high level of detail and vivid special effects. The game's physics-enhanced environments are interactive and destructible, offering traps and obstacles that create added danger for players and monsters alike. These elements, along with a new quest system and random scripted events, have been integrated into the game’s random-level "
                    }
                ]
            }
        }
    ]
};