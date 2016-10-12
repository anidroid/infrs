  $(document).ready(function() {

    // $TODO: Fix ids in yml
    // $TODO: for btns to display normally: if, among elements, w>x or w<y, display:table

      $('.undercover').hide();

      if (QueryString['c']) {
          var cond = window.decode(window.QueryString.c)
      } else {
          cond = _.sample([1,2,3])
      };

      if (QueryString['d']) {
          var designsrc = window.decode(window.QueryString.d)
      } else {
          designsrc = 'design.yml'
      };

      // Function to create a Profile object
      function T(ID, COND2, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, iiprobes) {
          this.ID = ID;
          this.COND2 = COND2;
          this.IIREF = IIREF; //teaching
          this.IIPRB = IIPRB;
          this.CUES = CUES;
          this.ACTRFACE = ACTRFACE;
          this.ACTRNAME = ACTRNAME;
          this.ACTRGEN = ACTRGEN;
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
                      COND2 = cnd;
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
                              usedNCUEREF = [];
                          }
                          probesOther = _.difference(probesOther, [IIPRB]);
                          // ... select probe words for each question/task
                          iiprobes = _.shuffle([IIPRB].concat(_.sample(probesOther.concat(probesNovel),9)));
                      } else {
                          IIREF = 'NA';
                          IIPRB = 'NA';
                          CUES = [];
                          for (c = 0; c < design.cond[cnd].nncues; c++) { //add neutral cues
                              CUEREF = _.sample(_.difference(_.range(0, design.cuesNeutral.length), usedNCUEREF));
                              usedNCUEREF.push(CUEREF);
                              CUES.push(design.cuesNeutral[CUEREF]);
                              usedNCUEREF = [];
                          }
                          iiprobes = _.shuffle(_.sample(probesOther.concat(probesNovel), 9));
                      }
                      datT.push(new T(ID, COND2, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, iiprobes))
                  }
              }
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
                  COND2 = "pretest"
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
                  CUEREF = allCues[i].CUEREF;
                  CUETXT = allCues[i].CUETXT;
                  CUES.push({
                      CUEREF: CUEREF,
                      CUETXT: CUETXT
                  });
                  probesOther = _.difference(probesOther, [IIPRB]);
                  // ... select probe words for each question/task
                  iiprobes = _.shuffle([IIPRB].concat(_.sample(probesOther.concat(probesNovel), 9)));
                  datT.push(new T(ID, COND2, IIREF, CUES, ACTRFACE, ACTRNAME, ACTRGEN, iiprobes));
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
          });

          routie('instr/?:bl', function(bl) {
              $('.undercover').hide();
              b = parseInt(bl)
              t = -1
              $('#instr').show();
              if (b == 0){
                $('#ctext').empty().append($.parseHTML(design.blocks[b].instr[c]));
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
                if (design.blocks[b].stimT) {
                  order.push({ trialid: 0, stimid: 0 })
                  for (var i = 1; i < datT.length/design.blocks[b].stimT; i++) {
                      for (var tr = 0; tr < design.blocks[b].trials.length; tr++) {
                          order.push({ trialid: tr, stimid: design.blocks[b].stimT*i })
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

          routie('b0/?:trial/?:stim', function(trial, stim) {
              var pageStart = Date.now()
              page++
              $('.undercover').hide();
              b = 0
              t = parseInt(trial)
              s = parseInt(stim)
                curr = design.blocks[b].trials[t]
              layout = '#' + curr.layout
              var hb = Handlebars.compile($(layout + '-template').html());
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
          });

          routie('b1/?:trial/?:stim', function(trial, stim) {
              $('.undercover').hide();
              b = 1
              t = parseInt(trial)
              s = parseInt(stim)
              curr = design.blocks[b].trials[t]
              layout = '#' + curr.layout
                  // var hb = Handlebars.compile($(layout+'-template').html());
                  // $(layout).show();
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
          });

          routie('b2/?:trial/?:stim', function(trial, stim) {
              $('.undercover').hide();
              b = 2
              t = parseInt(trial)
              s = parseInt(stim)
              curr = design.blocks[b].trials[t]
              layout = '#' + curr.layout
              res = 'NA'
              var hb = Handlebars.compile($(layout + '-template').html());
              $('#qq').html(hb(curr));
              $('#qq').show();
              if (orderid == 1) {
                  datP["ORDER_"+'Q'+curr.QID] = String('Q'+curr.QID+'_'+curr.QLB)
              } else {
                datP["ORDER_"+'Q'+curr.QID] = datP["ORDER_"+'Q'+curr.QID].concat(";"+String('Q'+curr.QID+'_'+curr.QLB))
              }
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
                          datP['Q'+curr.QID+'_'+curr.QLB] = $('.form-control').val();
                          nav(b, t)
                      });
                  break;
                  default:
                  console.log('err')
              }
          });

          routie('b3/?:trial/?:stim', function(trial, stim) {
              $('.undercover').hide();
              b = 3
              t = parseInt(trial)
              s = parseInt(stim)
              curr = design.blocks[b].trials[t]
              layout = '#' + curr.layout
              var hb = Handlebars.compile($(layout + '-template').html());
              $('#qq').html(hb(curr));
              $('#qq').show();
              res = 'NA'
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
