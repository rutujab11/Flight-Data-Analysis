const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const csvtojson = require("csvtojson");

const { Matrix } = require('ml-matrix');
const LogisticRegression = require('ml-logistic-regression');
const kmeans = require('node-kmeans');

const app = express()
app.use(bodyParser.urlencoded({ extended:true }));
mongoose.connect('mongodb://localhost:27017/FlightDB', {useNewUrlParser: true , useUnifiedTopology: true});

app.set('view engine', 'ejs');
app.use(express.static('public'));

const flightSchema = {

    'FL_DATE' : String,
    'OP_CARRIER' : String,
    'OP_CARRIER_FL_NUM' : Number,
    'ORIGIN' : String,
    'DEST' : String,
    'CRS_DEP_TIME' : Number,
    'DEP_TIME' : Number,
    'DEP_DELAY' : Number,
    'TAXI_OUT' : Number,
    'WHEELS_OFF' : Number,
    'WHEELS_ON' : Number,
    'TAXI_IN' : Number,
    'CRS_ARR_TIME' : Number,
    'ARR_TIME' : Number,
    'ARR_DELAY' : Number,
    'CANCELLED' : Number,
    'CANCELLATION_CODE' : String,
    'DIVERTED' : Number,
    'CRS_ELAPSED_TIME' : Number,
    'ACTUAL_ELAPSED_TIME' : Number,
    'AIR_TIME' : Number,
    'DISTANCE' : Number
};

const Model = mongoose.model('flights',flightSchema);

app.route("/")
    .get(function(req,res){
        res.render('index.ejs',{docs: [] ,predictionResults: null,KmeanResults : [], mapRed:null});
    })
    .post(function(req,res){
        
        Model.find(
            {ORIGIN : req.body.Source , DEST : req.body.Destination}
            ,function(err,docs){
            
            if(err){
                console.log("No Documents Found");
                alert("No Documents Found with Source "+req.body.Source+" and Destination "+req.body.Destination)
            }else{
                
                res.render('index.ejs',{ docs : docs, predictionResults:null,KmeanResults : [] ,mapRed:null});
            }
        });

    });

app.post("/insert",function(req,res){

    const doc = [{

            'FL_DATE' : req.body.FlightDate,
            'OP_CARRIER' : req.body.Carrier,
            'OP_CARRIER_FL_NUM' : req.body.OPCarrier,
            'ORIGIN' : req.body.Source,
            'DEST' : req.body.Destination,
            'CRS_DEP_TIME' : req.body.CRSDepartureTime,
            'DEP_TIME' : req.body.DepartureTime,
            'DEP_DELAY' : req.body.DepartureDelay,
            'TAXI_OUT' : req.body.TAXIout,
            'WHEELS_OFF' : req.body.WheelsOff,
            'WHEELS_ON' : req.body.Wheelson,
            'TAXI_IN' : req.body.TAXIin,
            'CRS_ARR_TIME' : req.body.CRSArTime,
            'ARR_TIME' : req.body.ARRTim,
            'ARR_DELAY' : req.body.ArrivalDelay,
            'CANCELLED' : req.body.Cancelled,
            'CANCELLATION_CODE' : req.body.CancellationCode,
            'DIVERTED' : req.body.Diverted,
            'CRS_ELAPSED_TIME' : req.body.CRS_ELAPSED_TIME,
            'ACTUAL_ELAPSED_TIME' : req.body.ACTUAL_ELAPSED_TIME,
            'AIR_TIME' : req.body.AirTime,
            'DISTANCE' : req.body.Distance

    }];

    Model.insertMany(doc,function(err){

        if(err){
            console.log("Failed to insert Document : "+err);
            alert("Failed to Insert Document");
        }else{
            res.redirect("/");
            alert("Document Successfully Inserted")
        }
    });
});

app.post("/insertFile",function(req,res){

    csvtojson()
    .fromFile(req.body.filename)
    .then(csvData => {
        Model.insertMany(csvData,function(err){
            if(err){
                console.log("Failed to insert Document : "+err);
                alert("Failed to Insert Document");
                res.redirect("/");
            }else{
                alert("Document Successfully Inserted")
                res.redirect("/");
            }
        });
    });

});


app.post("/Delete",function(req,res){

    Model.deleteOne({_id : req.body.ObjectId},function(err){

        if(err){
            console.log("Failed to delete Document : "+err);
            alert("Failed to Delete Document");
        }else{
            alert("Document Successfully Deleted")
            res.redirect("/");
        }

    });
    
});

app.post("/update",function(req,res){

    const [Id , colName , textChange] = [req.body.Object_id ,req.body.colname,req.body.changeto]

    Model.updateOne({_id:Id},{ $set : {colName : textChange}}, function(err){

        if(err){
            console.log("Failed to Update Document : "+err);
            alert("Failed to Update Document");
        }else{
            alert("Document Updated Successfully!!")
            res.redirect("/");
        }        

    });

});



app.post("/logistic",function(req,res){
    
    Model.find(
        {ORIGIN : req.body.Sour , DEST : req.body.Dest}
        ,function(err,docs){
        
        if(err){
            console.log("No Documents Found");
            alert("No Documents Found with Source "+req.body.Source+" and Destination "+req.body.Destination)
        }else{
            const train_X = [];
            const train_Y = [];
            docs.map(function(element){
                train_X.push([element.ARR_TIME ,element.ARR_DELAY ,element.DEP_TIME ,element.DEP_DELAY]);
                train_Y.push([element.CANCELLED]);
            });

            if(train_X.length !== 0){
                const X = new Matrix(train_X);
                const Y = new Matrix(train_Y);

                const logreg = new LogisticRegression({ numSteps: 1000, learningRate: 5e-3 });
                logreg.train(X,Y);

                const X_test = new Matrix([[req.body.Arr_Time ,req.body.Arr_Delay ,req.body.Dep_Time ,req.body.Dep_Delay]]);
                const finalResults = logreg.predict(X_test);
                //console.log(finalResults);
                if(finalResults[0] === 0){
                    res.render("index.ejs",{docs:[],predictionResults:true,KmeanResults : [],mapRed:null});
                }
                if(finalResults[0] === 1){
                    res.render("index.ejs",{docs:[],predictionResults:false,KmeanResults : [],mapRed:null});
                }
            }
        }
    });

});

app.post("/kmeans",function(req,res){

    Model.find(
        {
            ORIGIN : req.body.AD , 
            DEST : req.body.DD
        }
        ,function(err,docs){
            if(err){
                console.log("Error");
            }else{

                const Kdata = [];    
                docs.map(function(ele){
                    
                    if(ele.ARR_DELAY != null && ele.DEP_DELAY != null)
                        Kdata.push([ele.ARR_DELAY ,ele.DEP_DELAY]);
                    
                });
                kmeans.clusterize(Kdata, {k: req.body.clusters}, (error,results) => {
                    if (error){ 
                        console.error(error);
                    }
                    else {
                        //console.log('%o',results);
                        res.render('index.ejs',{docs:[],predictionResults:null,KmeanResults : results,mapRed : null})
                    }
                });
            }
    });
});

app.post("/mapreduce",function(req,res){

    var o = {},
        self = this;
    o.map = function () {
        emit(this.ORIGIN, 1)
    };
    o.reduce = function (k, vals) {
        return vals.length
    };

    Model.mapReduce(o,function(err,result){
        if(err){
            console.log(err);
        }else{
            //console.log(result);
            res.render('index.ejs',{docs:[],predictionResults:null,KmeanResults : [],mapRed : result.stats});
        }
    });
});

app.listen(3000,function(){
    console.log("Server is up and running on http://localhost:3000");
});