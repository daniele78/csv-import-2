/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function () {

    resetfunc(); //delete SESSION parameters

//I read the language setted in main.php and load the corresponding json file.
    var lang_text = Array();

    $.ajax({
        dataType: "json",
        url: "../lang/lang_" + $("#language").val() + ".json",
        async: false,
        success: function (data) {
            lang_text = data;
        }
    });//close $.ajax


//INIT
    var dbtabledata = null; //object for MySql-preview-table
    var csvtabledata = null; //object for csv-preview-table
    var select_html_db = null; //html-code to create selectbox config assoc (Described below).

    var direction_msg_1 = lang_text["msg"]["direction_msg_1"];
    var direction_msg_2 = lang_text["msg"]["direction_msg_2"];

    var need_db_table_select = lang_text["msg"]["need_db_table_select"];
    var need_csv_upload = lang_text["msg"]["need_csv_upload"];

    $(".dbtocsv").hide();

    JQUERY4U.sendToServer("init.php"); //reset all settings parameters saved in session 

    /////////////EV HANDLE//////////////////////////

    //It does everything as it was immediately after login
    $("#reinit-btn").click(function () {
        resetfunc();
        location.reload();
    });

    function resetfunc() {
        JQUERY4U.sendToServer("init.php"); //reset all settings parameters saved in session 

    }

    $("#select-mysql-table").change(function () {
        dbtabledata = null;
        saveConf();
        show_db_preview();
        show_config_table();
    });

    $("#autoconf").click(function () {
        if ($(this).is(":checked")) {
            $(".csvconf").prop('disabled', 'disabled');
            update();
        } else {
            $(".csvconf").prop('disabled', false);
        }

    });


    $("#enclosure, #separator, #charset").change(function () {
        update();
    });


    $('#div_radio_btn').change(function () {
        checkbtntest();
    });

    $('input:radio[name=radiopreview]').click(function () {

        if ($(this).val() == 'csv') {

            if (csvtabledata) {
                show_csv_preview();
            } else {
                show_msg(need_csv_upload);
            }

        } else if ($(this).val() == 'db') {

            if (dbtabledata) {
                show_db_preview();
            } else {
                show_msg(need_db_table_select);
            }

        }
    });

    $("#garbage").click(function () {
        if ($("#select-mysql-table").val() == "") {
            alert(lang_text["alerts"]["nomysqltableselected"]);
        } else if (confirm(lang_text["alerts"]["truncatetablecautionmsg"])) {
            $.post("deleteondb.php", {"tablename": $("#select-mysql-table").val()}, function (data, status) {
                //alert("Data: " + data + "\nStatus: " + status);
                dbtabledata = null;
                show_db_preview();
            });
        }
    });

    $(document).on('click', '#import-btn', function () {
        $("#show_diff_file").hide();
        var arr = getAssocCsvDb();
        if (arr["assoc"].length != 0) {
            if (confirm(lang_text["alerts"]["writeindatabasecaution"])) {
                var issue = JQUERY4U.sendToServer("save_on_db.php?lang=" + $("#language").val(), JSON.stringify(arr));

                var msg = "";
                switch (issue[0]) {
                    case 0:
                        msg = lang_text["alerts"]["answermsnocsvdata"];
                        break;
                    case 1:
                        msg = lang_text["alerts"]["success"];
                        show_db_preview();
                        break;
                    case 2:
                        msg = lang_text["alerts"]["dbmserror"] +" \"" + issue[1] + "\""; //msg from DBMS
                        break;
                    case 3:
                        msg = lang_text["alerts"]["importedwitherror"];
                        $("#show_diff_file").show();
                        break;
                    default:
                        break;
                }
                show_db_preview();
                alert(msg)
            }
        }

    });


    $("#show_diff_file").click(function () {
        document.location = "wrapper.php?filename=Fehler.xls";
    });

    $(document).on('click', '#export-btn', function () {
        var arr = getAssocCsvDb();
        if (arr["assoc"].length != 0) {
            var issue = JQUERY4U.sendToServer("create_csv.php", JSON.stringify(arr));
            // alert(issue)
            if (issue == "success") {
                document.location = "wrapper.php";
            } else {
                alert(lang_text["alerts"]["error"]);
            }
        } else {
            alert(lang_text["info"]["info_export"]);
        }
    });

    ///////////////////////////////////////////////////



    ///////////////FUNCTIONS///////////////////////////


    function update() {
        csvtabledata = null;
        saveConf();
        if ($('input:radio[name=radiopreview]').val() == 'csv' && $("#uploaded-file-name span").html() != "") {
            show_csv_preview();
        }
    }

    function getAssocCsvDb() {

        var arr_assoc = Array();
        var arr_csv_options = Array();
        var index = 0;
        var csv_index = 0;

        $('.csv-column br').remove();

        $("#configuration-table tr select").each(function () {

            var selected_value = $(this).val();
            var csv_col = $(this).closest("tr").find(".csv-column").html();

            if (selected_value != "") {
                arr_assoc[index++] = {
                    "dbcolumnname": selected_value,
                    "csvindex": csv_index,
                    "csvcolumnname": csv_col
                }
            }
            csv_index++;
        });

        arr_csv_options = {
            "tablename": $("#select-mysql-table").val(),
            "filename": $("#uploaded-file-name span").html(),
            "separator": $("#separator").val(),
            "enclosure": $("#enclosure").val(),
            "charset": $("#charset").val()
        }

        var arr = {
            "csv_options": arr_csv_options,
            "assoc": arr_assoc
        };

        // alert(JSON.stringify(arr["assoc"]));

        return arr;

    }



    function show_msg(msg) {

        $("#info-msg").html(msg).removeAttr('style').fadeOut(15000);
    }


    //This function save the settings in the session. It does not save the actual values but only indexing. PHP gets the actual values using the array-mapping.    
    function saveConf() {
        var pos = $("#select-mysql-table option:selected").attr("data-id");
        var tablename = pos == "0" ? "" : $("#select-mysql-table").val();
        JQUERY4U.sendToServer("session.php", JSON.stringify({
            "pos": pos,
            "tablename": tablename,
            "fnup": $("#uploaded-file-name span").html(),
            "chset": $("#charset").val(),
            "sep": $("#separator").val(),
            "encl": $("#enclosure").val(),
            "autoconf": $("#autoconf").is(":checked")
        }));
    }

    function show_db_preview() {
        //  if (!dbtabledata) {
        //      dbtabledata = JQUERY4U.sendToServer("getcontenttable.php");
        //  }
        $("#wait-icon").show();
        $('input:radio[name=radiopreview]').val(['db']); //set radiobutton for title

        $("#mytable").empty();

        $('#mytable').mytable({
            //'tablearrayjs': dbtabledata,
            'numrowperpage': 10,
            'serverside': true,
            'ajaxpage': "getcontenttable.php",
            'emptymsg': lang_text["msg"]["emptymsg"],
            'totalresultmsg': lang_text["msg"]["totalresultmsg"],
            'success': function (arr) {
                dbtabledata = JSON.parse(arr);
            }
        });
        $("#wait-icon").hide();
    }

    function show_csv_preview() {

        if (get_direction() === "dbtocsv") {
            $("#mytable").empty();
            return;
        }

        $("#wait-icon").show();

        $("#mytable").empty();

        $('#mytable').mytable({
            //  'tablearrayjs': csvtabledata,
            'numrowperpage': 10,
            'serverside': true,
            'ajaxpage': "csvhandle.php",
            'emptymsg': lang_text["msg"]["emptymsg"],
            'success': function (arr) {
                csvtabledata = JSON.parse(arr);
                $("#charset").val(csvtabledata["info"]["chset"]);
                $("#separator").val(csvtabledata["info"]["sep"]);
                $('input:radio[name=radiopreview]').val(['csv']); //set radiobutton for title
            }
        });
        $("#wait-icon").hide();
    }


    function getCodeForSelectboxDb() {
        var html = "<select class=\"db_assoc\" onchange=\"JQUERY4U.assocChange() \">\n" +
                "<option value=\"\">&nbsp;</option>";
        if (dbtabledata) {
            for (var i = 0; i < dbtabledata["tabheader"].length; i++) {
                html += "<option value=\"" + dbtabledata["tabheader"][i]["data"] + "\">" + dbtabledata["tabheader"][i]["data"] + "</option>\n";
            }
        }
        html += "</select>";
        return html;
    }


    function show_config_table() {
        $("#wait-icon").show();
        //check
        if ($("#select-mysql-table").val() == "" || !dbtabledata) {  //no mysqltable selected
            show_msg(need_db_table_select);
            $("#wait-icon").hide();
            return;
        }


        if (get_direction() == "csvtodb") {
            if ($("#uploaded-file-name span").html() == "" || !csvtabledata) {
                show_msg(need_csv_upload);
                $("#wait-icon").hide();
                return;
            }
        }
        //show table

        var html_header = "";
        var html_body = "";
        var html_footer = "";
        select_html_db = getCodeForSelectboxDb();

        if (get_direction() == "csvtodb") {   //csvtodb

            html_header = "<thead><tr><td colspan=3 id=\"direction-title\">" + lang_text["msg"]["direction_msg_1"] + "<img src=\"../css/info.png\" title=\"" + lang_text["info"]["info_inport"] + "\" alt=\"info\" class=\"info-icon\" onclick=\"alert(this.getAttribute('title'))\"></td></thead><tbody>";
            html_footer = "</tbody>\n<tfoot><tr><td colspan=3><button id=\"import-btn\">" + lang_text["button"]["import"] + "</button></td></tr></tfoot>";


            for (var i = 0; i < csvtabledata["tabheader"].length; i++) { //csv column
                html_body += "<tr><td class=\"csv-column\">" + csvtabledata["tabheader"][i]["title"] + "</td><td>---></td><td>" + select_html_db + "</td><tr>\n";
            }

        } else {  //dbtocsv

            html_header = "<thead><tr><td colspan=3 id=\"direction-title\">" + lang_text["info"]["info_export"] + "<img src=\"../css/info.png\" title=\"" + lang_text["info"]["info_export"] + "\" alt=\"info\" class=\"info-icon\" onclick=\"alert(this.getAttribute('title'))\"></td></thead><tbody>";
            html_footer = "</tbody>\n<tfoot><tr><td colspan=3><button id=\"export-btn\">" + lang_text["button"]["export"] + "</button>\n</tr></td></tfoot>";

            for (var i = 0; i < dbtabledata["tabheader"].length; i++) {  //db column
                html_body += "<tr class=\"exp\"><td>" + select_html_db + "</td><td>---></td><td contenteditable=\"true\" class=\"csv-column\" ></td></tr>";
            }

        }

        $("#configuration-table").html(html_header + html_body + html_footer);

        $("#wait-icon").hide();

    }

//checkbtntest handle events on function change import/export or export/import
    function checkbtntest() { // if radiobtn change

        if (get_direction() === "csvtodb") { //inport in db  
            $(".csvtodb").show();
            $(".dbtocsv").hide();

            $("#autoconf").removeAttr('disabled');

            if ($("#uploaded-file-name span").html() == "") {
                show_msg(need_csv_upload);
            } else {
                show_csv_preview();
                if ($("#select-mysql-table").val() == "") {
                    show_msg(need_db_table_select);
                } else {
                    show_config_table();
                }
            }

        } else { //export in csv    if db to csv
            //alert("export")
            $(".csvtodb").hide();
            $(".dbtocsv").show();
            $("#autoconf").removeAttr("checked");
            $("#autoconf").attr('disabled', 'disabled');

            $(".csvconf").removeAttr('disabled');

            if ($("#select-mysql-table").val() == "") {
                show_msg(need_db_table_select);
            } else {
                show_db_preview();
                show_config_table();
            }
        }
    }

////////////////// BLOCKS /////////////////////////////////////

    $("#fileuploader").uploadFile({
        url: "upload.php",
        maxFileSize: $("#max_upload_size").val(),
        sizeErrorStr: lang_text["error"]["upload_error"],
        dragDrop: false,
        fileName: "myfile",
        returnType: "json",
        showDelete: false,
        showDownload: false,
        showProgress: true,
        multiple: false,
        //showError:false,
        acceptFiles: "text/csv, application/zip",
        uploadStr: lang_text["button"]["upload"],
        onSelect: function (files)
        {
            
            var filename = files[0].name;
            var extension = filename.slice(-3);
            var maxsize = $("#max_upload_size").val();
            var actualsize = files[0].size.toString();
            var msgerruploadpartial_1 = lang_text["alerts"]["msgerruploadpartial_1"];
            var msgerruploadpartial_2 = lang_text["alerts"]["msgerruploadpartial_2"];
            var msgerruploadpartial_3 = lang_text["alerts"]["msgerruploadpartial_3"];
            if(maxsize.localeCompare(actualsize) < 0){
                if(extension.toLowerCase() == "zip"){
                   alert(msgerruploadpartial_1 + " " + msgerruploadpartial_2) 
                }else{
                    alert(msgerruploadpartial_1 + " " + msgerruploadpartial_2+ " " + msgerruploadpartial_3);
                }
                return false;
            }
            
            //alert($("#max_upload_size").val())
            //return confirm(files[0].size)
            //return true; //to allow file submission.
        },
        onSubmit: function (files)
        {
            $("#wait-icon").show();
        },
        onSuccess: function (files, data, xhr, pd)
        {
            csvtabledata = null;
            $("#uploaded-file-name").find("span").html(data[0]);
            saveConf();
            show_csv_preview();
            show_config_table();
            $("#wait-icon").hide();
        },
        onError: function (files, status, errMsg, pd)
        {
            $("#wait-icon").hide();
            alert(errMsg)
        }
    });


    function get_direction() {
        // return "dbtocsv" or "csvtodb"
        return $("input[name='radio_inp_exp']:checked").val();
        //       return "csvtodb";                                         //always return csvtodb. implemented now only export function
    }
//////////////////////////////////////////////////////////////


    //   $("#dialog").dialog();


});//close $(document).ready...
