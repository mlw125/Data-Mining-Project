/**
 * Created by Matthew Williams on 4/26/2016.
 */

// need to add everything from other js file

// holds the results from google
var searchItems;
// gets the index of a result when checked
var checkIndex = [];
// the list of results that can be manipulated
var reorderedResults = [];
// the list of results as they are originally found
var reorderedResultsOrig = [];

// get the url to send to solr
function solrUrl(searchText) {
    var url = "http://localhost:8983/solr/gettingstarted_shard1_replica1/select?q=" + searchText + "&wt=json&indent=true";
    return url;
}

function reqListener() {
    console.log(this.responseText);
}

// on the loading of the page
window.onload = function(){
    document.getElementById('searchButton').onclick = function(){
        // clear all the data in the results section
        document.getElementById("results").innerHTML = "";
        document.getElementById("results2").innerHTML = "";

        checkIndex.length = 0;

        // get the search query
        var query = document.getElementById('query').value;

        var dataSolr = solrUrl(query);

        var xhttpSolr = new XMLHttpRequest();
        xhttpSolr.addEventListener("load", reqListener);

        xhttpSolr.onload = function () {
            if (xhttpSolr.readyState == 4 && xhttpSolr.status == 200) {
                resultsDisplaySolr(xhttpSolr.responseText);
            }};
        xhttpSolr.open("GET", dataSolr, true);
        xhttpSolr.send();

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
};

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
    }
}

function resultsDisplaySolr(response) {
    var queryResults = JSON.parse(response);
    searchItems = queryResults;

    var tempArray = [];
    for(var y = 0; y < searchItems.response.docs.length; y++) {
        tempArray.push(y);
    }
    reorderedResultsOrig = tempArray.slice(0);

    for(var x = 0; x < queryResults.response.docs.length; x++) {
        var checkBox = createCheckBox(x);
        var tmp = document.createElement("div");
        tmp.appendChild(checkBox);
        checkBox = tmp.innerHTML;
        var results = document.createElement("div");
        results.innerHTML = "<br><div>" + x + checkBox + queryResults.response.docs[x].title + "</div>";
        document.getElementById("results").appendChild(results);
    } // end for
} // resultsDisplaySolr()

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
        var title = searchItems.response.docs[index].title;

        // combine into one document string
        if(checkIndex.length == 1 || x+1 == checkIndex.length) {
            documentArray += title;
        }
        else {
            documentArray += title + " ";
        }
    } // end for

    // preprocess the document
    documentArray = preprocess(documentArray);

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
        strDoc = strDoc.toString();
        strDoc = strDoc.replace(/\./g,' ');
        strDoc = strDoc.replace(/[^\w\s]/gi, '');
        strDoc = strDoc.toLowerCase();
        strDoc = strDoc.toString();
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
        strDoc = strDoc.toString();
        strArray = strDoc.split(" ");
    } // end else

    return strArray;
} // end preprocess()

function normalize(dictionaryCount){
    // array to hold the normalized data (tf / sum of tf)
    var dictionaryCountNorm = [];
    for (var y = 0; y < dictionaryCount.length; y++) {
        dictionaryCountNorm.push(dictionaryCount[y] / dictionaryCount.length);
    } // end for

    cosineSimilarity(dictionaryCountNorm);
} // normalize()

function cosineSimilarity(dictionaryCountNorm) {

    var cosineArray = [];
    // loop through every result from google
    for(var x = 0; x < reorderedResults.length; x++) {
        // get the normalized count vector of each esult
        var documentVector = findVector(reorderedResults[x]);

        // get the norm of the result
        var total = 0;
        for(var docIndex = 0; docIndex < documentVector.length; docIndex++) {
            total += Math.pow(documentVector[docIndex], 2);
        } // end for
        var resultNorm = Math.sqrt(total);

        var docTotal = 0;
        for(var w = 0; w < dictionaryCountNorm.length; w++) {
            // this will be the normalized tf from the documents
            docTotal += Math.pow(dictionaryCountNorm[w], 2);
        } // end for
        var docNorm = Math.sqrt(docTotal);

        // get the cosine similarity
        // dotProduct(result tf, document query tf) / ||Result|| * ||Document x||
        var cosineSimilarity = dotProduct(documentVector, dictionaryCountNorm) / (resultNorm * docNorm);
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
    // get the title of the search result
    var documentArray = searchItems.response.docs[index].title;

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
        } // end if
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
        results.innerHTML = "<br><div>" + searchItems.response.docs[index].title + "</div>";
        document.getElementById("results2").appendChild(results);
    } // end for
    var decoration = document.createElement("hr");
    document.getElementById("results2").appendChild(decoration);
} // end displayReRank()

function jaccard() {
    // holds the strings from the titles
    var resultDocument;

    // loop through all the values in checkIndex and
    // get the title, strip it down and put it into an array
    for(var x = 0; x < checkIndex.length; x++) {
        var index = checkIndex[x];
        var title = searchItems.response.docs[index].title;

        // combine into one document
        resultDocument += title + " ";
    }

    // preprocess the document
    var dictionaryString = preprocess(resultDocument);

    // temp array to hold data from each result
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
        // make sure the document doesn't have repeats
        var title = searchItems.response.docs[reorderedResultsOrig[y]].title;
        var documentArray = preprocess(title);
        //documentArray = preprocess(documentArray);

        // find the intersection of each document and document set
        var intersection = getIntersection(documentArray, dictionaryString);
        // find the union of each document and document set
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
    // loop through each document
    for (var x = 0; x < documentArray.length; x++) {
        var found = false;
        // loop through each string in the document
        for (var y = 0; y < union.length; y++) {
            // if the string from a result is found in the large document, then
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
