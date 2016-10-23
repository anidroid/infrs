  $(document).ready(function() {

    // $TODO: SPELLCHECK!
    // $TODO: resp dismiss produces an annoying error

      $('.undercover').hide();

      if (QueryString['c']) {
          var cond = window.decode(window.QueryString.c)
      } else {
          cond = _.sample([1,2])
      };

      if (QueryString['d']) {
          var designsrc = window.decode(window.QueryString.d)
      } else {
          designsrc = 'design.yml'
      };

      // Function to create a Profile object
      function T(ID, C_DREL, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, PR_PRB_SAME, PR_PRB_OTHR,iiprobes) {
          this.ID = ID;
          this.C_DREL = C_DREL;
          this.IIREF = IIREF; //teaching
          this.IIPRB = IIPRB;
          this.CUES = CUES;
          this.ACTRFACE = ACTRFACE;
          this.ACTRNAME = ACTRNAME;
          this.ACTRGEN = ACTRGEN;
          this.PR_PRB_SAME = PR_PRB_SAME;
          this.PR_PRB_OTHR = PR_PRB_OTHR;
          this.iiprobes = iiprobes;
      }

      // FUNCTIONS
      function callbackStimuli(data) {

          design = YAML.parse(data);

          // KINTO settings to yml?
          var remote_adr = design.server.remote_adr;
          var bucket_name = 'app';
          var collection_name = design.server.collection;
          var pn = _.sample(_.range(1, 9999), 1).toString();
          var pn_token = makeid(); // generate random string
          var db = new KintoClient(remote_adr, {
              bucket: bucket_name,
              headers: {
                  Authorization: "Basic " + btoa(pn + ":" + pn_token)
              }
          });
          var kdat = db.bucket(bucket_name).collection(collection_name);

          path = design.path;
          datP = {}
          datP["PN"] = pn;
          datP["COND1"] = cond;
          datP['IITOTAL'] = 0;
          bonus = 0;
          usedNames = []
          usedMFaces = []
          usedFFaces = []
          usediip = []
          usedCues = []
          probesOther = []
          for (i = 0; i < design.ii.length; i++) {
              probesOther.push(design.ii[i]['probe']);
          }
          probesNovel = design.probesNovel
          usedIIREF = [];
          usedDCUEREF = [];
          usedNCUEREF = [];
          datT = [];
          if (design.pretest != 1) {
              for (cnd = 0; cnd < design.cond.length; cnd++) { //loop tru conditions
                  for (t = 0; t < design.cond[cnd].ntargets; t++) { //loop tru targets
                      C_DREL = cnd;
                      ID = cnd + t;
                      ACTRGEN = _.sample(["m", "f"]);
                      if (ACTRGEN === "m") {
                          ACTRNAME = _.sample(_.difference(design.names.m, usedNames));
                          usedNames.push(ACTRNAME);
                          faceRef = _.sample(_.difference(_.range(1, 40), usedMFaces));
                          usedMFaces.push(faceRef);
                          ACTRFACE = design.imgsrc + "m/" + faceRef + ".jpg";
                      } else if (ACTRGEN === "f") {
                          ACTRNAME = _.sample(_.difference(design.names.f, usedNames));
                          usedNames.push(ACTRNAME);
                          faceRef = _.sample(_.difference(_.range(1, 40), usedFFaces));
                          usedFFaces.push(faceRef);
                          ACTRFACE = design.imgsrc + "f/" + faceRef + ".jpg"
                      } else {
                          console.log('err')
                      }
                      if (design.cond[cnd].ndcues > 0) { //there is at least one diagnostic cue
                          IIREF = _.sample(_.difference(_.range(0, design.ii.length), usedIIREF)); //set expertise
                          usedIIREF.push(IIREF);
                          IIPRB = design.ii[IIREF]['probe'];
                          CUES = [];
                          for (c = 0; c < design.cond[cnd].ndcues; c++) { //add diagnostic cues
                              CUEREF = _.sample(_.difference(_.range(0, design.ii[IIREF].cues.length), usedDCUEREF));
                              usedDCUEREF.push(CUEREF);
                              CUES.push(design.ii[IIREF].cues[CUEREF]);
                              usedDCUEREF = [];
                          }
                          for (c = 0; c < design.cond[cnd].nncues; c++) { //add neutral cues
                              CUEREF = _.sample(_.difference(_.range(0, design.cuesNeutral.length), usedNCUEREF));
                              usedNCUEREF.push(CUEREF);
                              CUES.push(design.cuesNeutral[CUEREF]);
                              //usedNCUEREF = [];
                          }
                          // ... select probe words for each question/task
                          iiprobes = _.shuffle([IIPRB].concat(_.sample(probesOther.concat(probesNovel),9)));
                          PR_PRB_SAME = IIPRB;
                          PR_PRB_OTHR = _.sample(_.difference(probesOther, [IIPRB]));
                      } else {
                          IIREF = 'NA';
                          IIPRB = 'NA';
                          CUES = [];
                          for (c = 0; c < design.cond[cnd].nncues; c++) { //add neutral cues
                              CUEREF = _.sample(_.difference(_.range(0, design.cuesNeutral.length), usedNCUEREF));
                              usedNCUEREF.push(CUEREF);
                              CUES.push(design.cuesNeutral[CUEREF]);
                              //usedNCUEREF = [];
                          }
                          iiprobes = _.shuffle(_.sample(probesOther.concat(probesNovel), 10 ));
                          PR_PRB_SAME = design.cuesNeutral[CUEREF].probe
                          PR_PRB_OTHR = undefined
                      }
                      datT.push(new T(ID, C_DREL, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, PR_PRB_SAME, PR_PRB_OTHR, iiprobes))
                  }
              }
              datT = _.shuffle(datT)

          } else if (design.pretest == 1) {
              allCues = []
              for (i = 0; i < design.ii.length; i++) {
                  for (c = 0; c < design.ii[i].cues.length; c++) {
                      allCues.push({
                          IIREF: i,
                          IIPRB: design.ii[i].probe,
                          CUEREF: c,
                          CUETXT: design.ii[i].cues[c]
                      });
                  }
              }
              for (i = design.ptrange.first; i < design.ptrange.last; i++) {
                  ID = i;
                  CUES = [];
                  C_DREL = "pretest"
                  ACTRGEN = _.sample(["m", "f"]);
                  if (ACTRGEN === "m") {
                      ACTRNAME = _.sample(_.difference(design.names.m, usedNames));
                      usedNames.push(ACTRNAME);
                      if (usedNames.length >= design.names.m.length) {
                          usedNames.length = [];
                      }
                      faceRef = _.sample(_.difference(_.range(1, 40), usedMFaces));
                      usedMFaces.push(faceRef);
                      ACTRFACE = design.imgsrc + "m/" + faceRef + ".jpg";
                      if (usedMFaces.length >= 30) {
                          usedMFaces.length = [];
                      }
                  } else if (ACTRGEN === "f") {
                      ACTRNAME = _.sample(_.difference(design.names.f, usedNames));
                      usedNames.push(ACTRNAME);
                      if (usedNames.length >= design.names.f.length) {
                          usedNames.length = [];
                      }
                      faceRef = _.sample(_.difference(_.range(1, 40), usedFFaces));
                      usedFFaces.push(faceRef);
                      ACTRFACE = design.imgsrc + "f/" + faceRef + ".jpg"
                      if (usedFFaces.length >= 30) {
                          usedFFaces.length = [];
                      }
                  } else {
                      console.log('err')
                  }
                  IIREF = allCues[i].IIREF;
                  IIPRB = allCues[i].IIPRB;
                  CUES.push(allCues[i].CUETXT);
                  probesOther = _.difference(probesOther, [IIPRB]);
                  // ... select probe words for each question/task
                  iiprobes = _.shuffle([IIPRB].concat(_.sample(probesOther.concat(probesNovel), 10)));
                  datT.push(new T(ID, C_DREL, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, "NA", "NA", iiprobes));
              }
          } else {
              console.log('err')
          }

          // add partials
          Handlebars.registerPartial("stimcomplete", $("#stimcomplete-partial").html());
          Handlebars.registerPartial("stimtarget", $("#stimtarget-partial").html());
          // compile templates
          var templateStimT = Handlebars.compile($("#stim-template-t").html());
          var templateStimP = Handlebars.compile($("#stim-template-p").html());
          var templateQT1 = Handlebars.compile($("#qt1-template").html());
          var templateQT2 = Handlebars.compile($("#qt1a-template").html());


          // find out how to do swsitch/case OR

          routie('init', function(bl) {
              $('.undercover').hide();
              $('#instr').show();
              $('#ctext').empty().append($.parseHTML(design.consent));
              $('.btn-instr').off('click').on('click', function() {
                  $('#instr').hide();
                  routie('instr/0')
              });
              page=-1;
              datP['START'] = Date.now()
          });

          routie('instr/?:bl', function(bl) {
              $('.undercover').hide();
              b = parseInt(bl)
              t = -1
              $('#instr').show();
              if (b == 0 && design.pretest == false){
                $('#ctext').empty().append($.parseHTML(design.blocks[b].instr[2]));
              } else {
                $('#ctext').empty().append($.parseHTML(design.blocks[b].instr));
              }
              $('.btn-instr').off('click').on('click', function() {
                  $('#instr').hide();
                  nav(b, t)
              });
              //this whole thing is a mess -->
              if (design.blocks[b].eachT == true) {
                order = []; orderid = 0
                if (design.blocks[b].stimT != undefined) {
                  order.push({ trialid: 0, stimid: 0 })
                  for (var i = 1; i < datT.length/design.blocks[0].stimT[cond]; i++) {
                      for (var tr = 0; tr < design.blocks[0].trials.length; tr++) {
                          order.push({ trialid: tr, stimid: design.blocks[0].stimT[cond]*i })
                      }
                  }
                } else {
                  for (var i = 0; i < datT.length; i++) {
                      for (var tr = 0; tr < design.blocks[b].trials.length; tr++) {
                          order.push({ trialid: tr, stimid: i })
                      }
                  }
                }
                if (design.blocks[b].randomized == true) {
                    order = _.shuffle(order);
                  }
              } else if (design.blocks[b].randomized == true) {
                  order = []; orderid = 0
                    for (var tr = 0; tr < design.blocks[b].trials.length; tr++) {
                        order.push({ trialid: tr, stimid: 0 })
                    }
                  order = _.shuffle(order);
              }

          });

          routie('b/?:block/?:trial/?:stim', function(block, trial, stim) {
            b = parseInt(block);
            $('.undercover').hide();
            t = parseInt(trial)
            s = parseInt(stim)
            curr = design.blocks[b].trials[t]
            layout = '#' + curr.layout
            var hb = Handlebars.compile($(layout + '-template').html());
            switch(design.blocks[b].type){
              case 'pretest':
                  var hb = Handlebars.compile($(layout + '-template-n').html());
                  $('#stim').show();
                  $(layout).html(hb(datT[s]));
                  $('#qt1').show();
                  $('#q1stim').hide();
                  $('#qt1text').html(curr.text);
                  $('#q1resp').html(templateQT1({
                      'options': datT[s][curr.options]
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
                  $('.btn-resp').off('click').on('click', function() {
                      datT[s].DR_RESP = $(this).data('resp');
                      if (datT[s].IIPRB === $(this).data('resp')) {
                          datT[s].DR_SCORE = 1;
                          datP['IITOTAL'] = datP['IITOTAL'] + 1;
                      } else if (datT[s].IIPRB != 'na') {
                          datT[s].DR_SCORE = 0;
                      } else(datT[s].DR_SCORE = 'na');
                      nav(b)
                  });
              break;
              case 'stim':
                  var pageStart = Date.now()
                  page++
                  $(layout).show();
                  datt = [];
                  for (i = s; i < s + design.blocks[b].stimT[cond]; i++) {
                      datt.push(datT[i])
                      if(datT[i]){ datT[i]["L_PAGE"] = page; }
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
                      datT[s]["L_PAGE_DUR"] = (Date.now() - pageStart) / 1000;
                      for (i = s; i < s + design.blocks[b].stimT[cond]; i++) {
                          datT[i]["L_PAGE_DUR"] = (Date.now() - pageStart) / 1000;
                          datT[i]["L_PAGE_DURPP"] = Math.round((Date.now() - pageStart) / design.blocks[b].stimT[cond])*1000/1000 / 1000;
                      }
                      nav(b)
                  });
              break;
              case 'ii':
                  $(layout).show();
                  $(layout + 'text').html(curr.text);
                  $('#q1stim').html(templateStimT(datT[s]));
                  $('#q1resp').html(templateQT1({
                      'options': datT[s][curr.options]
                  }));
                  datT[s]["DR_ORDER"] = orderid

                  //nav(2,t,r)
                  $('.btn-resp').off('click').on('click', function() {
                      datT[s].DR_RESP = $(this).data('resp');
                      if (datT[s].IIPRB === $(this).data('resp')) {
                          datT[s].DR_CORR = 1;
                          datP['IITOTAL'] = datP['IITOTAL'] + 1;
                      } else if (datT[s].IIPRB != 'na') {
                          datT[s].DR_CORR = 0;
                      } else(datT[s].DR_CORR = 'na');
                      nav(b)
                  });
              break;
              case 'pr':
                  if (datT[s][curr.probes]==undefined) {
                    nav(b,t)
                  } else {
                    $(layout).show();
                    $(layout + 'text').html(curr.text);
                    $('#q2stim').html(templateStimT(datT[s]));
                    $('#q2probe').html(templateStimP(datT[s][curr.probes])); ////cmt:optional
                    $('#q2resp').html(templateQT2({
                        'options': curr.options
                    }));
                  }
                  $('.btn-resp').off('click').on('click', function() {
                      datT[s][design.blocks[b].QID+'_RESP_'+curr.grouplbl] = $(this).data('resp')
                      nav(b,t)
                  });
              break;
              case 'flwp':
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
                          res=''
                          $('.btn-resp').off('click').on('click', function() {
                              for (i = 0; i < $('.btn-options').length; i++) {
                                  lab = $($('.btn-options')[i]).text();
                                  if($($('.btn-options')[i]).hasClass('selected')){
                                    res = res.concat(lab+'_')
                                  };
                              }
                              datP['Q_'+ curr.QLB] = res;
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
                                datP['Q_'+curr.QLB] = res
                                nav(b, t)
                                reqresp.dismiss()
                              }
                          });
                      break;
                      case 3:
                          $('.btn-resp').off('click').on('click', function() {
                              res = $('.form-control').val();
                              datP['Q_'+curr.QLB] = res;
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
