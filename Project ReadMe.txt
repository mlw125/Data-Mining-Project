Matthew Williams

Web Access: http://cs.txstate.edu/~mlw125/ (The lucene page will not work properly)

Implementation:

-Platform: I did my google search using any browser (at least Firefox and Chrome). Solr I could only get to work on when locally run and with an extension on Google Chrome.
-Language: I implemented my code using basic Javascript ( my first time so nothing fancy) and pure HTML without CSS.
-Pre-processing: I have tried to include everything that was listed on the project document. This includes case-folding: All the words in the query and documents are made to lowercase.
	Porter's Stemming Algorithm: I have found online ( and sourced it) that will perform this algorithm on every string in the query and document.
	Stop Word Removal: I have an array of all stop words and I compare every string to them and delete them when equal.
	I have also included options to remove these algorithms from the simlarity search, but only for cosine similarity.
-Vector Space Model: For my vector space model I used a lot of arrays. 
	Cosine Similarity: I split the user's document into an array of strings ( combining title and snippet) and then got the term frequency, storing that into yet another array.
		I then normalize all the data and that is put into another array, with the index matching that of the count array.
		I then do the same for each search result. Finally the cosine similarity is found and stored onto an array.
	Jaccard Simlarity: I also split the user's document and the other documents into string arrays. I then made arrays of each union and intersection to compare.
-Simlarity Measure:
	Cosine Similarity: To calculate the measure I took the dot product of the normalized arrays and divided it by the magnitude of both the large document and each search result.						
	Jaccard Similarity: I took the intersection of the search results and the selected document and divided it by the union.
-Experiments: I had some sample data my friend gave me so that I could test a query against static data (essentially debug mode for my program). This allowed me to see the more drastic changes since the query didn't have to
	relate to the search results. I also tested it with google search results and this gave me fewer changes since google is also processing the results and matching each result to my query. As far as I can tell 
	the program runs correctly. With lucene the search results are quite different from the query. The sample data was mostly solr files and many had strange names. Overall it appears to be as well as the google search.
	
Observations: As mentioned before I noticed fewer changes when using direct google results, since they tailor each result to my query, though occasionally the order of the selected results change. The static data allowed me
	to see a little more drastic changes since it was set for a certain query (Diablo) and I could check for my own.The results definitely varied depending on the type of preproccessing that I chose.

Comments: This was a very interesting project and I had to learn Javascript right away. Getting lucene to work was a pain, but work the change in the grade.

More About Lucene:

As mentioned above I used Solr to implement Lucene. It creates a server onyour device that you access through the web. Since there were issues using it
through the school server, I had to do everything locally (like everyone else I think).

The document collection was a random assortment of solr files and some of my own files. The search seems a bit wonky or it is indexing in ways I don't understand.

Example queries will be in another file.

Observations: Like I've said before I am not sure how Solr indexes things since the results are strange. Overall though, it worked just like the google search with minor changes.

Comments: I almost need a class for Solr to better understand it.