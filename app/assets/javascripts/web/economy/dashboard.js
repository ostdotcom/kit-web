;
(function (window,$) {

    var pieChartConstants = {
      legendsLabelAndClass: {
        "user_to_user" : {
          label : "User to User",
          class : 'color-bar-yellow'
        },
        "company_to_user" : {
          label : 'Company to User',
          class : 'color-bar-red'
        },
        "user_to_company" : {
          label : "User to Company",
          class : 'color-bar-blue'
        }
      }
    };

    var ost = ns('ost'),
        PriceOracle = ost.PriceOracle,
        graphConfig = ost.dashboardGraphConfig,
        filterOptionsMap               = graphConfig.filterOptionsMap,
        transactions_and_ost_volume    = graphConfig.transactions_and_ost_volume,
        transaction_by_type_line_graph = graphConfig.transaction_by_type_line_graph,
        transaction_by_type_pie_chart  = graphConfig.transaction_by_type_pie_chart,
        transaction_by_name            = graphConfig.transaction_by_name,
        utilities                      = ns("ost.utilities"),
      
        sPieChartWrapper = '.pie-chart-wrapper',
        sNoVolumeHTML    = '#noVolumeHTML'
    ;
    
    var preHtml , precision = 5 ,  defaultFilter = "week";
    
    var oThis = ost.dashboard = {
      init: function (config) {
          $.extend(oThis,config);
          oThis.initCharts();
          oThis.bindActions();
          utilities.reformatDecimals();
      },

      initCharts: function(){
        preHtml = $('#tx_by_type').html() ;
        oThis.updateTransactionAndOstVolumeGraphConfig();
        oThis.transactionAndOstVolumeGraph = new GoogleCharts();
        oThis.transactionByNameGraph = new GoogleCharts();
        oThis.transactionByTypeLineGraph = new GoogleCharts();
        oThis.drawTransactionAndOstVolumeGraph() ;
        oThis.drawTransactionByTypeLineGraph() ;
        oThis.drawTransactionByNameGraph() ;
      },

      updateTransactionAndOstVolumeGraphConfig: function(){
        var seriesConfig = utilities.deepGet(transactions_and_ost_volume,'options.series');
        seriesConfig[1].labelInLegend = 'Value of Transactions in '+ oThis.token_symbol+' (right axis)';
      },

      setAxisConfiguration: function(config, filter, res) {
        filter = filter || defaultFilter ;
        var hAxis = utilities.deepGet( config , 'options.hAxis' ),
          gridlines = hAxis['gridlines'] ,
          columns = config['columns']
        ;
        gridlines['count'] = filterOptionsMap[filter].count;
        hAxis['format']=filterOptionsMap[filter].format;
        columns[0] = filterOptionsMap[filter].columns_1;
        
        if( res && filter == defaultFilter  ){
          var result_type = utilities.deepGet(res ,  'data.result_type'),
              ticks = []
          ;
          if(result_type) {
            res.data[result_type].forEach(function (elem) {
              ticks.push(new Date(elem.timestamp * 1000));
            });
            hAxis.ticks = ticks;
          }
        }

      },

      setVAxisScaleForTxAndOstVolumeGraph: function(config, res) {
        var vAxes = utilities.deepGet( config , 'options.vAxes' ),
          viewWindow = vAxes[1].viewWindow,
          total_transactions = utilities.deepGet(res , 'data.total_transactions'),
          txVolumeArray = []
        ;
        for(var i=0; i<total_transactions.length;i++){
          txVolumeArray.push(total_transactions[i] && total_transactions[i].token_ost_volume);
        }
       var max = Math.max.apply(window, txVolumeArray);
        if( max == 0){
          viewWindow['max'] = 1
        }
      },

      drawTransactionAndOstVolumeGraph: function (filter) {
        var config = $.extend(true , {} , transactions_and_ost_volume ),
            url = oThis.getAjaxUrl( oThis.transactions_and_ost_volume_url , filter) ,
            ajax = utilities.deepGet( config , 'ajax' )
        ;
        ajax['url'] = url ;
        var ajaxCallback = GoogleCharts.prototype.ajaxCallback;
        oThis.transactionAndOstVolumeGraph.ajaxCallback = function( rawData ){
          var gCThis = this ;
          oThis.setAxisConfiguration( config, filter, rawData );
          oThis.setVAxisScaleForTxAndOstVolumeGraph( config, rawData );
          $.extend( true , gCThis ,  config  );
          return ajaxCallback.call( gCThis , rawData );
        };

        oThis.transactionAndOstVolumeGraph.draw(config);
      },

      drawTransactionByTypeLineGraph: function(filter){
        var config = $.extend(true , {} , transaction_by_type_line_graph ),
          url = oThis.getAjaxUrl( oThis.transaction_by_type_url , filter ) ,
          ajax = utilities.deepGet( config , 'ajax' )
        ;
        ajax['url'] = url ;
        var ajaxCallback = GoogleCharts.prototype.ajaxCallback ,
            render =  GoogleCharts.prototype.render
        ;
        oThis.transactionByTypeLineGraph.ajaxCallback = function( rawData ){
          var gCThis = this ;
          oThis.setAxisConfiguration( config, filter, rawData );
          $.extend( true , gCThis ,  config  );
          return ajaxCallback.call( gCThis , rawData );
        };

        oThis.transactionByTypeLineGraph.render = function(  ){
            var gCThis = this ,
                jEL =  $(gCThis.selector)
            ;
            jEL.html(preHtml);
            render.call( gCThis );
        };

        oThis.transactionByTypeLineGraph.draw( config, function( res ){
          oThis.drawTransactionByTypePieChart( res );
          var jWrapper = $(oThis.transactionByTypeLineGraph.selector) ;
          jWrapper.find('.loading-wrapper').remove();
          jWrapper.find('.'+oThis.transactionByTypeLineGraph.loadingClass).removeClass( oThis.transactionByTypeLineGraph.loadingClass );
        });
      },

      drawTransactionByTypePieChart: function( response ){
        
        var jPieChartContainer = $('.pie-chart-container'),
            config = $.extend(true , {} , transaction_by_type_pie_chart ),
            data   = response.data['transaction_volume'],
            total  =  0 ,
            isAllZero = true
        ;
  
        data = data.map(function ( item ) {
          var val =  item['value'] ,
              category = item['category']
          ;
          item['category_label']  = category && category.replace(/_/g, ' ');
          val =  Number( val );
          item['value'] = val ;
          total +=  val ;
          if( val > 0 ){
            isAllZero = false;
          }
          return item;
        });
  
        if( isAllZero ){
          jPieChartContainer.find(sNoVolumeHTML).show();
          jPieChartContainer.find(sPieChartWrapper).hide();
          return false;
        }
  
        oThis.updateLegend( data );
        total = BigNumber( String( total ) ).decimalPlaces( precision ).toString();
        jPieChartContainer.find(sNoVolumeHTML).hide();
        $('.total-transactions-value').text( total );
        config.readyHandler = function () {
          jPieChartContainer.find(sPieChartWrapper).show();
        };
        oThis.transactionByTypePieChart = new GoogleCharts( config );
        config.data = oThis.transactionByTypePieChart.dataParser(data);
        oThis.transactionByTypePieChart.draw( config  );
      },

      updateLegend: function( data ) {
        var source = document.getElementById("ostTransactionsPieChart").innerHTML,
            template = Handlebars.compile(source),
            context = {},
            markUp
        ;

        context['data'] = JSON.parse(JSON.stringify(data));
        context['data'].forEach( function( value , index ) {
          var config = utilities.deepGet(pieChartConstants, 'legendsLabelAndClass.'+value.category );
          value['label'] = config['label'];
          value['class'] = config['class'];
        });
        markUp = template( context );
        $('.pieChartLegend').html( markUp );
      },

      drawTransactionByNameGraph : function (filter) {

        var config = $.extend(true , {} , transaction_by_name ),
          url = oThis.getAjaxUrl( oThis.transaction_by_name_url , filter) ,
          ajax = utilities.deepGet( config , 'ajax' )
        ;
        ajax['url'] = url ;
        
        oThis.transactionByNameGraph.draw( config  , function ( res ) {
          oThis.setDate( res, filter );
        });
      },

      setDate : function( res, filter ) {
        var data  = utilities.deepGet( res , 'data.meta'),
          startDate, endDate, displayDate, sDateContainer
        ;
        sDateContainer = $('.date-container');
        startDate = moment(data['startTimestamp'] * 1000).format("D MMM [']YY");
        endDate = moment(data['endTimestamp'] * 1000).format("D MMM [']YY");
        displayDate = startDate;
        if( endDate ){
          displayDate += " - "+ endDate;
        }
        $(sDateContainer).html(displayDate);
      },

      getAjaxUrl: function (apis , filter ) {
        filter =  filter || defaultFilter ;
        return apis[filter];
      },

      bindActions :function () {
       var  jTransactionsAndOstVolumeIntervals = $('.transactions_and_ost_volume .interval'),
            jTransactionsByNameIntervals       = $('.transaction_by_name .interval'),
            jTransactionsByTypeIntervals       = $('.transaction_by_type .interval')
       ;
        jTransactionsAndOstVolumeIntervals.on('click',function (event) {
          jTransactionsAndOstVolumeIntervals.removeClass('active');
          $(this).addClass('active');
          oThis.drawTransactionAndOstVolumeGraph( $(this).data('interval'));
        });

        jTransactionsByNameIntervals.on('click',function (event) {
          jTransactionsByNameIntervals.removeClass('active');
          $(this).addClass('active');
          oThis.drawTransactionByNameGraph($(this).data('interval'));
        });

        jTransactionsByTypeIntervals.on('click',function (event) {
          jTransactionsByTypeIntervals.removeClass('active');
          $(this).addClass('active');
          oThis.drawTransactionByTypeLineGraph($(this).data('interval'));
        });
      }
    }
  }(window,jQuery)
)