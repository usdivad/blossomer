/*
 * Analysis
 */

//types of analysis
var MARKOV_NOTE = 0;
var MARKOV_PR = 1;
var FREQ_OCCUR = 2;

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

//Note class, represents a single note with pitch and rhythm attributes e.g. 39w
function Note(pitch, rhythm)
{
	this.pitch = Number(pitch);
	this.rhythm = String(rhythm);
	this.freqBase = 0;
	this.prbArray = [];
	this.pitch_prbArray = [];
	this.rhythm_prbArray = [];
}

//converts rhythm shorthand (e.g. w for whole) into verbal duration
function rhythmToString(r)
{
	//using quarter note as base (1) and sixteenth as smallest unit
	if (r==WHOLE)
		return "whole";
	else if (r==HALF)
		return "half";
	else if (r==QUARTER)
		return "quarter";
	else if (r==EIGHTH)
		return "eighth";
	else if (r==SIXTEENTH)
		return "sixteenth";
	else if (r==DHALF)
		return "dotted half";
	else if (r==DQUARTER)
		return "dotted quarter";
	else if (r==DEIGHTH)
		return "dotted eighth";
	else //invalid
		return "invalid";
}

/* 
//analyze input from HTML form
//(Array data, String type)
function analyze(data, type)
{
	var s = "";
	if (type==typePitch)
		s += markov(dataPitch, type);
	else
		s += markov(dataRhythm, type);
		
	s+= "starting note: (" + pStart + ", " + rStart + ")\n";
	//s += "poop";
	//document.write(s);
	console.log(s);
}
*/
 
//performs single-order markov chain analysis
//(Array<Note> range, Array<Note> data,)
function markov(data)
{
	var s =  "Total number of notes (incl. rests): " + data.length;
	s+="<br>";
	//s+="\n";
	//var pCount = 0; //same as i in for loop
	
	//SETTING UP RANGES
	var allRanges = []; //will contain range, pRange, rRange
	
	//setting up note range array
	var range = [];
	for (var i=0; i<data.length; i++)
	{
		//if (range.indexOf(data[i])==0) //not yet added
		var added = 0;
		for (var j=0; j<range.length; j++)
		{
			if (data[i].pitch == range[j].pitch && data[i].rhythm == range[j].rhythm)
				added = 1;
		}
		if (added==0)
			range.push(data[i]);
	}
	
	//pitch range, rhythm range
	//filling both with notes
	var pRange = [];
	var rRange = [];
	for (var i=0; i<data.length; i++)
	{
		var pAdded = 0;
		var rAdded = 0;
		for (var p=0; p<pRange.length; p++)
		{
			if (data[i].pitch == pRange[p].pitch)
				pAdded = 1;
		}
		for (var r=0; r<rRange.length; r++)
		{
			if (data[i].rhythm == rRange[r].rhythm)
				rAdded = 1;
		}
		if (pAdded == 0) {
			pRange.push(new Note(data[i].pitch, QUARTER));
		} //need freqs here
		if (rAdded == 0) {
			rRange.push(new Note(60, data[i].rhythm));
		}
	}
	
	s+= "Number of unique notes: " + range.length + "<br>";
	s+= "Number of unique pitches: " + pRange.length + "<br>";
	s+= "Number of unique rhythms: " + rRange.length + "<br>";
	s+= "<br>----------------";
	s+= "<br>Note-by-Note Analysis:<br><br>";

	//pick base value (x in "x is followed by y")
	for (var i=0; i<range.length; i++)
	{
		var value1 = range[i];
		/*if (analyzed.indexOf(value1)!=-1) //already analyzed
			continue;*/
		var count1 = 0;
		//pick follow value (y in "x is followed by y")
		for (var j=0; j<range.length; j++)
		{
			var value2 = range[j];
			count1 = 0;
			var count2 = 0;
			
			//parse data array
			for (var k=0; k<data.length - 1; k++)
			{
				if (data[k].pitch == value1.pitch && data[k].rhythm == value1.rhythm)
				{
					count1++;
					if (data[k+1].pitch == value2.pitch && data[k+1].rhythm == value2.rhythm)
						count2++;
				}
			} //end parse array (k loop)
			if (j==0)
			{
				var freqBase = ((count1/(data.length-1))*100).toFixed(2);
				s+= "Note " + i + " is a " + rhythmToString(value1.rhythm) + " note with MIDI pitch " + value1.pitch + " and frequency " + freqBase + "%";
				s+="<br>"; //document.write
				//s+="\n"; //console.log
				
				//putting initial note into array
				range[i].freqBase = Number(freqBase);
			}
			if (count1 != 0) //don't need to worry about else case
			{
				//var freqFollow = ((count2/count1)*100).toFixed(2);
				var freqFollow = count2/count1;
				if (freqFollow>0)
				{
					s += "Note " + j + " (a " + rhythmToString(value2.rhythm) + " note with MIDI pitch " + value2.pitch + ") follows it " + (freqFollow*100).toFixed(2) + "% of the time";
					s += "<br>";
					//s+="\n";
				}
				
				//putting follow data into array; goes in pairs
				range[i].prbArray.push(value2);
				range[i].prbArray.push(freqFollow);
			}
		} //end pick y (j loop)		
		s+= "<br>";
		//s+="\n";
	} //end pick x	(i loop)
	
	//PR ANALYSIS; SHOULD BE DONE IN INNER METHOD
	s+= "<br>----------------";
	var s_pr = "<br>Pitch & Rhythm Set Analysis:<br>";

	//Pitch
	for (var i=0; i<pRange.length; i++)
	{
		var p1 = pRange[i];
		var count1 = 0;
		
		for (var j=0; j<pRange.length;j++)
		{
			var p2 = pRange[j];
			count1=0;
			var count2 = 0;
			
			for (var k=0; k<data.length-1;k++)
			{
				if (data[k].pitch == p1.pitch)
				{
					count1++;
					if (data[k+1].pitch == p2.pitch)
						count2++;
				}
			} //end kloop
			if (j==0)
			{
				var freqBase = ((count1/(data.length-1))*100).toFixed(2);
				s_pr += "<br>MIDI pitch " + p1.pitch + " has frequency " + freqBase + "%<br>";
				pRange[i].freqBase = Number(freqBase);
			}
			
			if (count1 != 0)
			{
				var freqFollow = count2/count1;
				if (freqFollow>0)
				{
					s_pr += "Pitch " + p2.pitch + " follows it " + (freqFollow*100).toFixed(2) + "% of the time<br>";
				}
				pRange[i].pitch_prbArray.push(p2);
				pRange[i].pitch_prbArray.push(freqFollow);
			}
		} //end j
	} //end x

	s_pr+="<br>";

	//Rhythm
	for (var i=0; i<rRange.length; i++)
	{
		var r1 = rRange[i];
		var count1 = 0;
		
		for (var j=0; j<rRange.length;j++)
		{
			var r2 = rRange[j];
			count1=0;
			var count2 = 0;
			
			for (var k=0; k<data.length-1;k++)
			{
				if (data[k].rhythm == r1.rhythm)
				{
					count1++;
					if (data[k+1].rhythm == r2.rhythm)
						count2++;
				}
			} //end kloop
			if (j==0)
			{
				var freqBase = ((count1/(data.length-1))*100).toFixed(2);
				s_pr += "<br>The " + rhythmToString(r1.rhythm) + "  note has frequency " + freqBase + "%<br>";
				rRange[i].freqBase = Number(freqBase);
			}
			
			if (count1 != 0)
			{
				var freqFollow = count2/count1;
				if (freqFollow>0)
				{
					s_pr += "The " + rhythmToString(r2.rhythm) + "  note follows it " + (freqFollow*100).toFixed(2) + "% of the time<br>";
				}
				rRange[i].rhythm_prbArray.push(r2);
				rRange[i].rhythm_prbArray.push(freqFollow);
			}
		} //end j
	} //end x
	s+=s_pr+ "<br>----------------" + "<br><br><br>";
	
	
	//pick starting note
	//var first = data[0];
	//return s;
	s+= "Playback begins on the first note of the melody.<br>";
	s+= 'The first note of the melody is also appended to the last to prevent "dead ends".<br>';
	s+= "Pitch 0 represents a rest (no pitch) rather than 8.1757989156 Hz.<br>";
	document.write(s); //bad oop!
	allRanges.push(range);
	allRanges.push(pRange);
	allRanges.push(rRange);
	return allRanges;
}



/**OUTPUTS STRING FOR RTCMIX USAGE**/
//based on range data from markov() and bpm from bpmIn
//note that note arrays are set up somewhat differently than pitch/rhythm ones
function toRtcmix(allRanges, bpm)
{
	var range = allRanges[0];
	var pRange = allRanges[1];
	var rRange = allRanges[2];
	
	var s =  "/*<br>&nbsp;* RTCMIX SCRIPT by Blossomer (http://www.columbia.edu/~dds2135/blossomer/)";
	s+="<br>&nbsp;* Pitches are in MIDI (middle C = 60). Rhythms are proportional to quarter notes (q=1).";
	s+="<br>&nbsp;* ~David Su<br>&nbsp;*/";
	s+="<br><br>//URL: " + window.location.href + "<br><br>";
	
	//INITIALIZE ARRAYS
	s+="/* this goes outside script<br>";
	
	//note
	for (var i=0; i<range.length; i++) {
		s+="n"+i+" = { }<br>";
	}
	
	//pitch
	for (var i=0; i<pRange.length; i++) {
		s+="p"+i+" = { }<br>";
	}
	
	//rhythm
	for (var i=0; i<rRange.length; i++) {
		s+="r"+i+" = { }<br>";
	}
	
	s+="tmp_n = { }<br>tmp_p = { }<br>tmp_r = { }<br>";
	s+="tmp_n = n0<br>tmp_p = p0<br>tmp_r = r0<br>";
	
	s+="*/<br><br>";
	
	
	s+="//INDIVIDUAL ARRAYS FOR EACH NOTE<br>";
	for (var i=0; i<range.length; i++) {
		var note = range[i];
		var nArray = note.prbArray;
		s+="n"+i+"["+0+"] = { "+(note.freqBase/100)+", "+note.pitch+", "+rhythmToDuration(note.rhythm)+" }";
		s+= " //freqBase, pitch, rhythm<br>";
		var index = 1;
		/*
		for (var j=0; j<nArray.length; j=j+2) {
			s+="n"+i+"["+(j+offset)+"] = n"+(j/2)+"<br>";
			s+="n"+i+"["+(j+1+offset)+"] = "+nArray[j+1]+"<br>";
		}
		*/
		
		for (var j=1; j<nArray.length; j=j+2) {
			if (nArray[j]!=0) {
				s+="n"+i+"["+index+"] = "+nArray[j]+"<br>"; //prb
				s+="n"+i+"["+(index+1)+"] = n"+((j-1)/2)+"<br>"; //note
				index = index+2;
			}
		}
		s+="<br>";
	}
	
	s+="//INDIVIDUAL ARRAYS FOR EACH PITCH<br>";
	for (var i=0; i<pRange.length; i++) {
		var note = pRange[i];
		var pArray = note.pitch_prbArray;
		s+="p"+i+"["+0+"] = "+note.pitch+" //pitch<br>";
		var index = 1;
		for (var j=1; j<pArray.length; j=j+2) { //j=1, not 0!
			if (pArray[j] != 0) {
				s+="p"+i+"["+index+"] = "+pArray[j]+"<br>";
				s+="p"+i+"["+(index+1)+"] = p"+((j-1)/2)+"<br>";
				index = index+2;
			}
		}
		s+="<br>";
	}
	
	s+="//INDIVIDUAL ARRAYS FOR EACH RHYTHM<br>";
	for (var i=0; i<rRange.length; i++) {
		var note = rRange[i];
		var rArray = note.rhythm_prbArray;
		s+="r"+i+"["+0+"] = "+rhythmToDuration(note.rhythm)+" //rhythm<br>";
		var index = 1;
		for (var j=1; j<rArray.length; j=j+2) { //j=1, not 0!
			if (rArray[j] != 0) {
				s+="r"+i+"["+index+"] = "+rArray[j]+"<br>";
				s+="r"+i+"["+(index+1)+"] = r"+((j-1)/2)+"<br>";
				index = index + 2;
			}
		}
		s+="<br>";
	}
	
	s+="//PLAYBACK: defaults to Markov(pitch/rhythm)<br>";
	s+="bpm = "+bpm+"<br>";
	s+="metro = 60/bpm<br>";
	s+="amp = 30000<br><br>";
	
	s+="//Markov(note)<br>";
	s+="/*<br>";
	s+="tmp_n_note = tmp_n[0]<br>";
	s+="out_p = cpsmidi(tmp_n_note[1])<br>";
	s+="out_r = tmp_n_note[2]*metro<br>";
	s+="*/<br><br>"
	
	s+="//Markov(pitch/rhythm)<br>";
	s+="out_p = cpsmidi(tmp_p[0])<br>";
	s+="out_r = tmp_r[0]*metro<br><br>";
	
	s+="//Replace with any instrument you want<br>";
	s+="//WAVETABLE(outsk, dur, AMP, PITCH[, PAN, WAVETABLE])<br>";
	s+="WAVETABLE(0, out_r, amp, out_p)<br><br>";

	s+="//PICK NEXT NOTE: defaults to 'pick pitch&rhythm'<br>";
	s+="//randomize<br>dice = random()<br><br>";
	
	s+="//pick note<br>";
	s+="/*<br>";
	s+="i=1 //one, not zero!<br>";
	s+="prb_n = tmp_n[i]<br>";
	s+="while(dice >= prb_n) {<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;i = i+2<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;prb_n = prb_n + tmp_n[i]<br>";
	s+="}<br>";
	s+="tmp_n = tmp_n[i+1] //set tmp to next array<br>";
	s+="*/<br><br>";
	
	s+="//pick pitch...<br>";
	s+="i=1 //one, not zero!<br>";
	s+="prb_p = tmp_p[i]<br>";
	s+="while(dice >= prb_p) {<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;i = i+2<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;prb_p = prb_p + tmp_p[i]<br>";
	s+="}<br>";
	s+="tmp_p = tmp_p[i+1] //set tmp to next array<br><br>";
	
	s+="//... & rhythm<br>";
	s+="i=1 //one, not zero!<br>";
	s+="prb_r = tmp_r[i]<br>";
	s+="while(dice >= prb_r) {<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;i = i+2<br>";
	s+="&nbsp;&nbsp;&nbsp;&nbsp;prb_r = prb_r + tmp_r[i]<br>";
	s+="}<br>";
	s+="tmp_r = tmp_r[i+1] //set tmp to next array<br><br>";
	
	s+="MAXBANG(out_r)";
	
	return s;
}