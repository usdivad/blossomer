/*
 * Methods and functions used for index.html
 */
 
//consts for input
var DURATION_MS = 750;
var KEY_S = 83;
var KEY_E = 69;
var KEY_Q = 81;
var KEY_H = 72;
var KEY_W = 87;
var KEY_D = 68;
var KEY_O = 79;
var KEY_T = 84;

//ivs
var r;
var p;

//vars for input generation
var GEN_NUM = 29; //# of notes to generate for generateIn()
var DRUNK_PMAX = 4; //upper bound of range for stepwise motion
//var DRUNK_RMAX = 3; //upper bound of range for rhythmic variation
var gPitch_diatonic = [60,62,64,65,67,69,71,72,74,76,77,79,81,83,0];
var gPitch_chromatic = [0];
for (var i=0; i<24;i++) {
	gPitch_chromatic.push(60+i);
}
//gPitch_chromatic.push(0);
var gPitch_pentatonic = [61,63,66,68,70,73,75,78];
var gRhythm = ["s","e","q"];
var g_curP;
var g_curR;

/*AUTOMATIC MELODY GENERATION FNS*/

//gets scale choice for generateIn()
function generateGet(val)
{
	var v = String(val);
	if (v == "diatonic")
		generateIn(gPitch_diatonic, gRhythm);
	else if (v == "chromatic")
		generateIn(gPitch_chromatic, gRhythm);
	else if (v == "pentatonic")
		generateIn(gPitch_pentatonic, gRhythm);

	
}

//submits the input form
function submitForm()
{
	var f = document.getElementById('inputForm');
	f.submit();
}


//generate input (drunk)
function generateIn(pArray, rArray)
{
	document.getElementById('notesIn').value = ""; //clear
	var pStart = Math.floor(Math.random()*pArray.length);
	var rStart = Math.floor(Math.random()*rArray.length);
	pickInNote(pStart, pArray, rStart, rArray, 0);
}

//recursively add input note and pick next input note
//direction+drunk are only used for pitch; rhythm is random
function pickInNote(pCur, pArray, rCur, rArray, noteNum)
{
	appendPR(document.getElementById('notesIn'), pArray[pCur], rArray[rCur]);
	
	if (noteNum<GEN_NUM)
	{
		var pDir = coinDirection(); //up or down
		//var rDir = coinDirection();	
		var pNext = pCur + pDir*(Math.floor(Math.random()*DRUNK_PMAX));
		if (pNext >= pArray.length || pNext < 0)
		{
			//if (pDir>0)
				pNext = pCur; //prevent arrayindexoutofbounds and adds higher prb for pitch repetition
			//else
				//pNext = 0; //rest
		}
		/*var rNext = rCur + rDir*(Math.floor(Math.random()*DRUNK_RMAX));
		if (rNext >= rArray.length || rNext < 0)
			rNext = rCur; //prevent arrayindexoutofbounds and adds higher prb for rhythm repetition*/
		var rNext = Math.floor(Math.random()*rArray.length);
		pickInNote(pNext, pArray, rNext, rArray, noteNum+1);
	}
}

//multiplier; -1 or 1
function coinDirection()
{
	var coin = Math.random();
	if (coin > 0.5) return 1;
	else return -1;
}

/*MANUAL INPUT FNS*/

//display & play
function display(v)
{
	//console.log(v);
	p = Number(v);
	//play
	if (p !=0)
		playMIDI(p, DURATION_MS);
}

//append a string value to an html text field
function append(field, value)
{
	var s = field.value;
	var v = String(value);
	v = v.replace(/n/, "");
	s += v+r;
	field.value = s;
	display(v);
	//moveCaretToEnd(field);
	//window.setTimeout(function(){field.blur();}, 1000);
}

//append p and r to an html text field (for generateIn())
function appendPR(field, pitch, rhythm)
{
	var s = field.value;
	s += String(pitch) + rhythm;
	field.value = s;
}

//set the variable r. id taken from an html obj
function rSet(id)
{
	var rPicks = document.getElementsByClassName("rhythmPick picked");
	for (var i=0; i<rPicks.length; i++)
	{
		rPicks[i].className = "rhythmPick";
	}
	document.getElementById(id).className = "rhythmPick picked";
	r = id;
}

//set defaults upon window.onload
function onLoadFunction()
{
	rSet("q");
	document.getElementById("bpmIn").value="120";
}

//keyboard shortcuts for rhythm durations
function detectKey(evt)
{
	var keyCode;
	if (window.event)
		keyCode = window.event.keyCode;
	else
		keyCode = evt.keyCode;

	if (keyCode==KEY_S) rSet("s");
	else if (keyCode==KEY_E) rSet("e");
	else if (keyCode==KEY_Q) rSet("q");
	else if (keyCode==KEY_H) rSet("h");
	else if (keyCode==KEY_W) rSet("w");
	else if (keyCode==KEY_D) rSet("d");
	else if (keyCode==KEY_O) rSet("o");
	else if (keyCode==KEY_T) rSet("t");
}

//delete the last note of the melodic input
function deleteLastNote()
{
	
	var s = document.getElementById("notesIn").value;
	
	var sArray = s.match(/\d+\D/g);
	if (sArray==null) return;
	
	sArray.pop();
	
	var sNew = "";
	
	for (var i=0; i<sArray.length; i++)
	{
		sNew += sArray[i];
	}
	
	document.getElementById("notesIn").value = sNew;
	
	/*
	var s = document.getElementById("notesIn").value;
	var notLast = 1;
	while (notLast!=0)
	{
		if (/ //regex goes here?
		if (s="") notLast=0;
	}
	*/
}

//play the melody as a sequence of notes
function playMelody()
{
	var s = document.getElementById("notesIn").value;
	if (s=="") return;
	var bpm_raw = document.getElementById("bpmIn").value;
	var bpm = Number(bpm_raw);
	var beat = BPMtoMilliseconds(bpm); //in ms
	var nArray = [];
	toNotes(nArray, s); //some shifty OOP here... sArray?
	nArray.pop(); //more shifty OOP cos of the analysis wraparound
	playMelodyNote(0, nArray, beat);
	
	/*
	var totalTime=0;
	for (var i=0; i<nArray.length; i++)
	{
		var p = nArray[i].pitch;
		var r = rhythmToDuration(nArray[i].rhythm);
		r = r*beat;
		totalTime = totalTime+r;
		playMIDI(p, r);
	}
	*/
		
}

//
function playMelodyNote(i, array, beat) //index, array of notes, beat in ms
{
	if (i < array.length)
	{
		var p = array[i].pitch;
		var r_raw = rhythmToDuration(array[i].rhythm);
		var r = r_raw*beat;
		if (p==0)
			stopToneAbsolute();
		else
			playTone(MIDItoHz(p));
		//playMIDI(p, r);
		setTimeout(function(){playMelodyNote(i+1, array, beat);}, r);
		//console.log("i="+i+" length="+array.length+" p="+p+" r="+r);
		//console.log(array);
	}
	else
		stopToneAbsolute();
}

/*
 *BPM tapper adapted from Rich Reel http://www.all8.com/tools/bpm.htm
 */
var count = 0;
var msecsFirst = 0;
var msecsPrevious = 0;

function ResetCount()
  {
  count = 0;
  document.getElementById("bpmIn").value = "";
  //document.TAP_DISPLAY.T_TAP.value = "";
  //document.TAP_DISPLAY.T_RESET.blur();
  }

function TapForBPM(e)
  {
  //document.TAP_DISPLAY.T_WAIT.blur();
  var timeSeconds = new Date;
  msecs = timeSeconds.getTime();
  if ((msecs - msecsPrevious) > 2000) //T_WAIT.value 2 seconds
    {
    count = 0;
    }

  if (count == 0)
    {
    //document.getElementById("bpmIn").value = "0";
    //document.TAP_DISPLAY.T_TAP.value = "First Beat";
    msecsFirst = msecs;
    count = 1;
    }
  else
    {
    var bpmAvg = 60000 * count / (msecs - msecsFirst);
    //document.getElementById("bpmIn").value = Math.round(bpmAvg * 100) / 100;
    document.getElementById("bpmIn").value = Math.round(bpmAvg);
    count++;
    //document.TAP_DISPLAY.T_TAP.value = count;
    }
  msecsPrevious = msecs;
  return true;
  }
//document.onkeypress = TapForBPM;


//DOCUMENT ACTIONS!
window.onload = onLoadFunction;
document.onkeydown = detectKey;