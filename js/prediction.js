//Returns object with url parameters https://jsperf.com/querystring-with-javascript
window.getQueryString = function(q) {
	return (function(a) {
		if (a == "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i) {
			var p = a[i].split('=');
			if (p.length != 2) continue;
			b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		}
	return b;
	})(q.split("&"));
};
//https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-dollars-currency-string-in-javascript
Number.prototype.formatMoney = function(n, x) {
    var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');
};

$(document).ready(function(){

var a = 500000; //goal
var n, //number of days left
	e, //number of days elapsed
	c, //current bpi
	p, //starting bpi
	goalRate,
	percDiff,
	parPrice;

var today = new Date(); //today
today.setHours(0,0,0,0);
var sDateStr, eDateStr;
var sDate = new Date("7/17/17"); //start date of prediction
var eDate = new Date("7/17/20"); //end date of prediction

//Sample URL Parameters: ?bpiPrediction=500000&startDate=7-17-17&endDate=7-17-20
function init(){
	var query = window.location.search.substring(1);
	var urlParams = window.getQueryString(query);
	a = urlParams["bpiPrediction"];
	$("#bpiPrediction, #bpiPrediction2").text("$"+(Number(a)).formatMoney(2));
	eDate = new Date(urlParams["endDate"]);
	sDate = new Date(urlParams["startDate"]);
	eDateStr = dateStr(eDate);
	$("#endDate").text(eDateStr);
	sDateStr = dateStr(sDate);
	$("#startDate").text(sDateStr);
	getDaysElapsed();
	getDaysLeft();
	getStartingBpi();
	//Datepicker init
	$("#createPrediction #startDate").datepicker( {
		format: 'yyyy-mm-dd',
	});
	var yDate = new Date();
	yDate.setDate(today.getDate()-1);
	$("#createPrediction #startDate").val(dateStr(yDate));
	$("#createPrediction #endDate").datepicker( {
		format: 'yyyy-mm-dd',
	});
}
init();

function dateStr(date){
	return date.getUTCFullYear()+"-"+("0"+(date.getUTCMonth()+1)).slice(-2)+"-"+("0"+date.getUTCDate()).slice(-2);
}

function getDaysLeft(){
	n = dayDiff(today, eDate);
	var dayStr = " days";
	if (n < 1){
		n = 0;
		dayStr = " day";
	}
	$("#daysLeft").text(n + dayStr);
	console.log("Number of Days Left: " + n);
}

 function getDaysElapsed(){
  	e = dayDiff(sDate, today);
  	$("#daysElapsed").val(e);
 	console.log("Number of Days Elapsed: " + e);
  }
  
//https://api.coindesk.com/v1/bpi/historical/close.json?start=2017-07-17&end=2017-07-17  
function getStartingBpi(){
	var url = "https://api.coindesk.com/v1/bpi/historical/close.json?start="+sDateStr+"&end="+sDateStr; 
	$.getJSON(url)
	.done(function ( json ) {
		setStartingBpi(json.bpi[sDateStr]);
		getCurrBpi();
	}).fail(function (jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	});
}

function getCurrBpi(){
	var url = "https://api.coindesk.com/v1/bpi/currentprice.json"; 
	$.getJSON(url)
	.done(function ( json ) {
		setCurrentBpi(json.bpi.USD.rate_float);
		getGoalRate();
		getParPrice();
		getPercDiff();
	}).fail(function (jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	});
}

function setStartingBpi(v){
	p = v;
	$('#startDate').attr('title', 'Starting price was: ' + "$" + (Number(p)).formatMoney(2));
	$('#startingPrice').text("$" + (Number(p)).formatMoney(2));
	console.log("Starting Bpi: " + p);
}

function setCurrentBpi(v){
	c = Math.round(v *100)/100;
	$("#currBpi").text("$"+(Number(c)).formatMoney(2));
	console.log("Current Bpi: " + c);
}

//goalRate = LOG10(a/p)/(n+e/365)
function getGoalRate(){
	var y = (n+e-1)/365;
	goalRate = Math.log10(a/p)/(y);
	console.log("Goal Rate: " + goalRate);
}

//percDiff = ((currBpi-parPrice)/parPrice)*100
function getPercDiff(){
	percDiff = ((c-parPrice)/parPrice)*100;
	var badgeStr;
	var dickMenuStr;
	var aheadOrBelowStr = "ahead of";
	parPriceHtml = '$' + (Number(parPrice)).formatMoney(2) + '</span>';
	var droppedOrIncreasedStr = 'If the price dropped to <span class="badge badge-danger">' + parPriceHtml + ' it would still be'; 
	$("#percDiff").text(Math.round(percDiff*100)/100 + "%");
	if (percDiff > 0 && percDiff < 10){
		badgeStr = "badge-warning";
		dickMenuStr = "Maybe?";
	}
	else if (percDiff > 10){
		badgeStr = "badge-success";
		dickMenuStr = "No!";
	} else {
		badgeStr = "badge-danger";
		dickMenuStr = "Yes!";
		aheadOrBelowStr = "below";
		droppedOrIncreasedStr = 'The price needs to increase to <span class="badge badge-success">' + parPriceHtml + ' to be';
	}
	$("#percDiff").addClass(badgeStr);currBpi
	$("#currBpi").addClass(badgeStr);
	$("#isDickOnTheMenu").text(dickMenuStr);
	$("#aheadOrBelow").text(aheadOrBelowStr);
	$("#droppedOrIncreased").html(droppedOrIncreasedStr);
	return percDiff;
}

//parPrice = 10^(g * (e/365)) * p
function getParPrice(){
	parPrice = Math.pow(10, goalRate * (e/365)) * p;
	$("#parPrice").text("$" + Math.round(parPrice*100)/100);
	console.log("Par price: " + parPrice);
}

//Returns the base log
function getBaseLog(x ,y){
	return Math.log(y) / Math.log(x);
}

//Returns difference between two dates
function dayDiff(first, second) {
	return Math.round((second-first)/(1000*60*60*24));
}


});