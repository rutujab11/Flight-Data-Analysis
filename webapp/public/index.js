$(document).ready(function(){

    $('#chart1').on('click',function(){
        $('#headImgs').text("Arrival Delay Vs Departure Delay");
        $('#chart').attr('src',"assets/chart1.png");
    });

    $('#chart2').on('click',function(){
        $('#headImgs').text("Average Aircraft Delay Value Vs Aircraft Delay Reason");
        $('#chart').attr('src',"assets/chart2.png");
    });

    $('#chart3').on('click',function(){
        $('#headImgs').text("Distance Travelled By Aircraft across World in a month");
        $('#chart').attr('src',"assets/chart3.png");
    });

    $('#chart4').on('click',function(){
        $('#headImgs').text("Value of Delay of each Aircraft from the Starting Point");
        $('#chart').attr('src',"assets/chart4.png");
    });

});