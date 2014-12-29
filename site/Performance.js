/*
 * Performance
 */

//create an AudioContext
var context;
try
{
	context = new webkitAudioContext();
}
catch(e)
{
	try
	{	
		context = new AudioContext();
	}
	catch(e)
	{
		alert("Sorry, playback is not supported in this browser :( Audio playback requires a browser that supports the Web Audio API for HTML5.");
	}
}

var oscillator = context.createOscillator();
oscillator.frequency.value = 0;
oscillator.start();

//counter of how many stopTone()'s are scheduled;
//if futureStop==1, means I'm the only stopTone()
var futureStop = 0;

//rhythm const vars
if (WHOLE==null)
	var WHOLE = "w";
if (HALF==null)
	var HALF = "h";
if (QUARTER==null)
	var QUARTER = "q";
if (EIGHTH==null)
	var EIGHTH = "e";
if (SIXTEENTH==null)
	var SIXTEENTH = "s";
//"dot"
if (DHALF==null)
	var DHALF = "d";
if (DQUARTER==null)
	var DQUARTER = "o";
if (DEIGHTH==null)
	var DEIGHTH = "t";
	

//analysis/generation type const vars
var STOP = 0;
var MARKOV_NOTE = 1;
var MARKOV_PR = 2;
var FREQ_OCCUR = 3;
var NRANGE = 0; //notes
var PRANGE = 1; //pitch
var RRANGE = 2; //rhythm



//play a single note as part of the blossom, then recursively pick&play next note
function playNote(note, BPM, type, rangeArray)
{
	//STOP!
	if (type == STOP) {
		stopToneAbsolute();
		pnoDepress();
		return;
	}
	
	//pressdown 
	pnoPress(note.pitch);
	
	var bpm = Number(BPM);
	var freq;
	//console.log("Playing note (" + note.pitch + ", " + note.rhythm + ")");
	if (note.pitch != 0)
		freq = (440 / 32) * (Math.pow(2,((note.pitch - 9) / 12)));
	else
		freq = 0; //rest
	var beat = (60/bpm) * 1000; //in ms
	var duration = rhythmToDuration(note.rhythm) * beat;
	var next;
	var typeNext;//get from doc
	var g = document.getElementById("gType").g;
	for (var i=0; i<g.length; i++) {
	if (g[i].checked)
		typeNext = Number(g[i].value);
	}
	
	//choose next note based on playback gen type
	if (type == MARKOV_NOTE) {
		next = pickNext_note(note, rangeArray);
	}
	else if (type == MARKOV_PR) {
		next = pickNext_pr(note, rangeArray);
	}
	else if (type == FREQ_OCCUR) {
		next = pickNext_freq(rangeArray);
	}
	//else if (type == STOP) {stopTone();} //do nothing
	playTone(freq);
	setTimeout(function(){playNote(next, BPM, typeNext, rangeArray);}, duration);

}

//choose next note based on probability arrays of pitches and rhythms
function pickNext_pr(note, rangeArray)
{
	var pRange = rangeArray[PRANGE];
	var rRange = rangeArray[RRANGE];
	var nRange = rangeArray[NRANGE];
	var n;
	
	//get
	if (note.prbArray.length!=0) { //a "real note"
		//console.log("real");
		n = new Note(note.pitch, note.rhythm);
		//console.log(n.pitch+","+n.rhythm);
		//getting p and r
		for (var i=0; i<pRange.length; i++) {
			//console.log(pRange[2].pitch);
			if (Number(n.pitch) == Number(pRange[i].pitch)) 
				n.pitch_prbArray = pRange[i].pitch_prbArray;
		}
		for (var i=0; i<rRange.length; i++) {
			if (n.rhythm == rRange[i].rhythm)
				n.rhythm_prbArray = rRange[i].rhythm_prbArray;
		}
	}
	else {
		n = note;
		//console.log("fake");
	}
	
	//choose
	var pNew;
	var rNew;
	var pPrbNew;
	var rPrbNew;
	var dice = Math.random();
	var i = 1;
	var prb_p = n.pitch_prbArray[i];
	while (dice>= prb_p)
	{
		i = i+2;
		prb_p = prb_p + n.pitch_prbArray[i];
	}
	pNew = n.pitch_prbArray[i-1].pitch;
	pPrbNew = n.pitch_prbArray[i-1].pitch_prbArray;
	
	i = 1;
	var prb_r = n.rhythm_prbArray[i];
	while (dice>= prb_r)
	{
		i = i+2;
		prb_r = prb_r + n.rhythm_prbArray[i];
	}
	rNew = n.rhythm_prbArray[i-1].rhythm;
	rPrbNew = n.rhythm_prbArray[i-1].rhythm_prbArray;
	
	n.pitch = pNew;
	n.rhythm = rNew;
	n.pitch_prbArray = pPrbNew;
	n.rhythm_prbArray = rPrbNew;
	n.prbArray = [];
	return n;
}

//choose next note based on probability array of notes
function pickNext_note(note, rangeArray)
{
	var nRange = rangeArray[NRANGE];
	var n;
	
	//get
	if (note.prbArray.length==0) { //note is for pr
		n = new Note(note.pitch, note.rhythm);
		//console.log(n.pitch+","+n.rhythm+","+n.prbArray.length);
		//getting p and r
		for (var i=0; i<nRange.length; i++) {
			if (n.pitch == nRange[i].pitch && n.rhythm == nRange[i].rhythm)
				n = nRange[i];
		}
		if (n.prbArray.length==0) { //if no exact match
			var coin = Math.random();
			if (coin>0.5) { //choose by pitch
				for (var p=0; p<nRange.length; p++) {
					if (Number(n.pitch) == Number(nRange[p].pitch))
						n = nRange[p];
				}
			}
			else { //choose by rhythm
				for (var r=0; r<nRange.length; r++) {
					if (n.rhythm == nRange[r].rhythm)
						n = nRange[r];
				}
			}
		}
		//console.log(n.pitch+","+n.rhythm+","+n.prbArray.length);
	}
	else //note is a "real" note already
		n = note;
		
	//choose
	var dice = Math.random();
	var i = 1;
	var prb = n.prbArray[i];
	while (dice >= prb)
	{
		i = i+2;
		prb = prb + n.prbArray[i];
	}
	return n.prbArray[i-1];
}

//choose next note based on freqBases
function pickNext_freq(rangeArray)
{
	var nRange = rangeArray[NRANGE];
	
		
	//choose
	var dice = Math.random()*100;
	var prb = 0;
	
	for (var i=0; i<nRange.length; i++) {
		prb += nRange[i].freqBase;
		console.log(dice+","+i);
		if (dice < prb || i == nRange.length - 1)
			return nRange[i];
	}

	//return nRange[i];
}

//convert rhythm shorthand to numeric duration
function rhythmToDuration(r)
{
	//using quarter note as base (1) and sixteenth as smallest unit
	if (r==WHOLE)
		return 4;
	else if (r==HALF)
		return 2;
	else if (r==QUARTER)
		return 1;
	else if (r==EIGHTH)
		return 0.5;
	else if (r==SIXTEENTH)
		return 0.25;
	else if (r==DHALF)
		return 3;
	else if (r==DQUARTER)
		return 1.5;
	else if (r==DEIGHTH)
		return 0.75;
	else //invalid
		return 0;
}

function setBPM(tempo)
{
	BPM = tempo;
}

//play a single frequency w/ sine wave. use stopTone() to shut it up
function playTone(freq)
{	
	//oscillator.start && oscillator.start(1);
	oscillator.stop(0);
	if (freq != 0)
	{
		oscillator = context.createOscillator();
		oscillator.type = 0;
		oscillator.frequency.value = freq;
		oscillator.connect(context.destination);
		//oscillator.start && oscillator.start(0);
		oscillator.start(0);
		//console.log(freq);
	}
}


//performance fn for piano in menu
function playMIDI(pitch, duration) //pitch in MIDI, duration in ms
{
	var freq = (440 / 32) * (Math.pow(2,((pitch - 9) / 12)));
	playTone(freq);
	futureStop++;
	setTimeout(function(){stopTone();}, duration);
	console.log(pitch + "->" + freq + ", " + duration);
}

//stops the oscillator; incorporates counter for cascading playTone() calls
//use stopToneAbsolute() to stop no matter what
function stopTone()
{
	if (futureStop <= 1) //I'm the last stopTone()
	{
		oscillator.stop(0);
		oscillator = context.createOscillator();
	}
	
	futureStop--;
}

//stops the oscillator NO MATTER WHAT!
function stopToneAbsolute()
{
	oscillator.stop(0);
	oscillator = context.createOscillator();
}

//depress all keys
function pnoDepress()
{
	var min = 48;
	var max = 83;
	for (var i=min; i<=max; i++) {
		var key = document.getElementById("n"+i);
		if (key.className == "key pressed")
			key.className = "key";
		else if (key.className == "key black pressed")
			key.className = "key black";
	}
	//document.getElementById("n"+0).className = "key"; //rest!
}

//press key currently being played
function pnoPress(pitch)
{
	pnoDepress();
	//var exp = "n"+pitch;
	var min = 48;
	var max = 83;
	for (var i=min; i<=max; i++) {
		//var str = "n"+i;
		//console.log(i+","+pitch);
		if (i == pitch) {
			//console.log("MATCH!");
			//console.log("n"+i);
			var key = document.getElementById("n"+i);
			if (key.className == "key") {
				key.className = "key pressed";
				//console.log("p");
			}
			else if (key.className == "key black")
				key.className = "key black pressed";
		}
	}
	
	/*
	if (0 == pitch) {
		document.getElementById("n"+0).className = "key pressed";
	}
	*/
}

function BPMtoSeconds(bpm)
{
	var sec = 60/bpm;
	return sec;
}

function BPMtoMilliseconds(bpm)
{
	return 1000*BPMtoSeconds(bpm);
}

//MIDI to frequency conversion (from subsynth.sourceforge.net/midinote2freq.html)
function MIDItoHzTable()
{
	var midi = [128];
	var a = 440; // a is 440 hz...
	for (var x = 0; x < 128; ++x)
	{
	   midi[x] = (a / 32) * (Math.pow(2,((x - 9) / 12)));
	}
	return midi;
}

//converts midi to hz
function MIDItoHz(midi)
{
	var freq = (440 / 32) * (Math.pow(2,((midi - 9) / 12)));
	return freq;
}
