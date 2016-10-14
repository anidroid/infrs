routie('b/?:block/?:trial/?:stim', function(block, trial, stim) {
  b = parseInt(block);
  $('.undercover').hide();
  t = parseInt(trial)
  s = parseInt(stim)
  curr = design.blocks[b].trials[t]
  layout = '#' + curr.layout
  var hb = Handlebars.compile($(layout + '-template').html());
  switch(b){
        case 0:
        var pageStart = Date.now()
        page++
        $(layout).show();
        datt = [];
        for (i = s; i < s + design.blocks[b].stimT; i++) {
            datt.push(datT[i])
            if(datT[i]){ datT[i]["PAGE"] = page; }
        }
        $(layout).html(hb({
            'hbprofiles': datt
        }));

        if (design.likes) {
            $('.btn-like').off('click').on('click', function() {
                if ($(this).hasClass('liked')) {
                    $(this).removeClass('liked');
                } else {
                    $(this).addClass('liked');
                }
                //datT[$(this).data('liked')].liked = 1;
            });
        } else {
            $('.btn-like').addClass('disabled');
        }
        //nav(1,t,r)
        $('.btn-stim').off('click').on('click', function() {
            datP['DURPG_' + page] = (Date.now() - pageStart) / 1000;
            datP['DURPG_' + page] = (Date.now() - pageStart) / 1000;
            nav(b)
        });
    break;
    case 1:
        $(layout).show();
        $(layout + 'text').html(curr.text);
        $('#q1stim').html(templateStimT(datT[s]));
        $('#q1resp').html(templateQT1({
            'options': datT[s][curr.options]
        }));
        datT[s]["ORDER_II"] = orderid

        //nav(2,t,r)
        $('.btn-resp').off('click').on('click', function() {
            datT[s].IIRESP = $(this).data('resp');
            if (datT[s].IIPRB === $(this).data('resp')) {
                datT[s].IISCORE = 1;
                datP['IITOTAL'] = datP['IITOTAL'] + 1;
            } else if (datT[s].IIPRB != 'na') {
                datT[s].IISCORE = 0;
            } else(datT[s].IISCORE = 'na');
            nav(b)
        });
    break;
    case 2:
        res = 'NA'
        $('#qq').html(hb(curr));
        $('#qq').show();
        // if (orderid == 1) {
        //     datP["ORDER_"+'Q'+curr.QID] = String('Q'+curr.QID+'_'+curr.QLB)
        // } else {
        //   datP["ORDER_"+'Q'+curr.QID] = datP["ORDER_"+'Q'+curr.QID].concat(";"+String('Q'+curr.QID+'_'+curr.QLB))
        // }
        switch (curr.QT) {
            case 1:
                $('.btn-raised').off('click').on('click', function() {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                    } else {
                        $(this).addClass('selected');
                    }
                });
                $('.btn-resp').off('click').on('click', function() {
                    for (i = 0; i < $('.btn-options').length; i++) {
                        lab = $($('.btn-options')[i]).text();
                        res = $($('.btn-options')[i]).hasClass('selected');
                        varname = 'Q' + curr.QID +'_'+ curr.QLB + '_' + lab
                        datP[varname] = res;
                    }
                    nav(b, t)
                });
            break;
            case 2:
                $('.btn-raised').off('click').on('click', function() {
                    res = $(this).data('val');
                    $('.btn-raised').removeClass('selected');
                    $(this).addClass('selected');
                });
                $('.btn-resp').off('click').on('click', function() {
                    if (res == 'NA'){
                      window.reqresp = alertify.error("Please give a response");
                    } else {
                      datP['Q'+curr.QID+'_'+curr.QLB] = res
                      nav(b, t)
                      reqresp.dismiss()
                    }
                });
            break;
            case 3:
                $('.btn-resp').off('click').on('click', function() {
                    res = $('.form-control').val();
                    datP['Q'+curr.QID+'_'+curr.QLB] = res;
                    if (curr.required == true){
                      if (res == ""){
                        window.reqresp = alertify.error("Please give a response");
                      } else {
                        nav(b, t)
                        reqresp.dismiss()
                      }
                    } else {
                    nav(b, t)}
                });
            break;
            default:
            console.log('err')
        }
    break;
    default:
    console.log('err')
  }
});

routie('end', function() {
  $('.undercover').hide();
  $('#debrief').show();
  $('#dtext1').empty().append($.parseHTML(design.debriefing.text1));
  $('#dtext1').append(design.debriefing.platform[0].code);
  $('#dtext2').empty().append($.parseHTML(design.debriefing.text2));
  $('#dtext2').append(datP["PN"]);
  $('#dtext2').append($.parseHTML(design.debriefing.text3));
  datP['END'] = Date.now();
  datP['DURATION'] = datP['END'] - datP['START'];
  datsave = {
      datp: JSON.stringify([datP]),
      datt: JSON.stringify(datT)
  }
  kdat.createRecord(datsave).then(function(res) {
      console.log('saved data on server')
  })
  $('.btn-end').off('click').on('click', function() {
      window.location.replace(design.endredirect)
  });
});

}


$.get(designsrc, callbackStimuli)

});
