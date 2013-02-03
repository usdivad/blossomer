/*
 * Input
 */

//get input from URL query string 
function queryStr(fieldName)
{
	var str = window.location.search.substring(1); //1 to remove "?"
	var strArray = str.split("&");
	for (var i=0;i<strArray.length;i++)
	{
		var fArray = strArray[i].split("=");
		var fName = fArray[0];
		var fContent = fArray[1];
		if (fName == fieldName)
		{
			return fContent;
		}
	}
	
} 

//get input
//(Array tgt, String src, String type)
//this tgt<-src business is so you can feed in external variables. scope!
function toNotes(tgt, src)
{
	//console.log(src);
	//var srcArray = src.split(" ");
	var srcArray = src.match(/\d+\D/g); //e.g. "401k"
	srcArray.push(srcArray[0]); //make first note follow last to prevent "dead end"
	var newSz = 0;
	for (var i=0; i<srcArray.length; i++)
	{
		var pitch = Number(srcArray[i].match(/\d+/));
		var rhythm = srcArray[i].match(/\D/);
		var note = new Note(pitch, rhythm);
		tgt[i] = note;
		//console.log(tgt[i]);
		newSz++;
	}
	tgt.length = newSz;
	//analyze(srcArray, type);
}