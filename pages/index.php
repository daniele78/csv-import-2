<?php
/* error_reporting(E_ALL | E_STRICT); // all = 2147483647  

  ini_set('display_error', 1);
  ini_set('ignore_repeated_errors', 0);
  ini_set('ignore_repeated_source', 0);
 */
session_start();

if(isset($_SESSION["islogged"])){
    $_SESSION["islogged"] = false;
}


include("../class/db.class.php");




$post_var = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

$err_msg = '';

if (isset($post_var["loginbtn"])) {

    $_SESSION["dbname"] = $post_var["dbname"];
    $_SESSION["hostname"] = $post_var["server"];
    $_SESSION["user"] = $post_var["username"];
    $_SESSION["password"] = $post_var["password"];
    $_SESSION["port"] = $post_var["port"];


    $db = new db(false);    // true = active debug

    if ($db->isLogged() == NULL) {
        $_SESSION["islogged"] = false;
        //$err_msg = "Die Anmeldung am MySQL-Server ist fehlgeschlagen";
        //$err_msg = $db->getError();
    } else {
        if($db->setDB($post_var["dbname"])){
        $_SESSION["islogged"] = true;
        header("Location: main.php");
        }else{
          //  $err_msg = $err_msg = $db->getError();
        }
    }
}
?>



<!DOCTYPE HTML>
<html>
    <head>
        <title>csv-import</title>
        <meta charset="UTF-8" />
        <link rel="stylesheet" type="text/css" href="../css/screen.css">
        <link rel="stylesheet" type="text/css" href="../css/login.css">
    </head>

    <body>

        <form class="box login" action="?" method="post">
            <?php
            if ($err_msg != "") {
                echo "<div class=\"error\"><span>Zugriff verweigert!</span><img class=\"info-icon\" onclick=\"alert(this.getAttribute('title'))\" src=\"../css/info.png\" alt=\"info\" title=\"" . $err_msg . "\" /></div>";
            }
            ?>
            <fieldset class="boxBody">
                <label for="dbname">DB Name</label>
                <input type="text" name="dbname" id="dbname"/>
                <label for="server">Server</label>
                <input type="text" name="server" id="server" value="localhost" />
                <label for="port">Port</label>
                <input type="text" name="port" id="port" value="3306" />       
                <label for="username">Benutzername</label>
                <input type="text" name="username" id="username" value="root" />
                <label for="password">Passwort</label>
                <input type="Password" name="password" id="password"/>
            </fieldset>

            <footer>

                <input type="submit" name="loginbtn" class="btnLogin" value="Zugriff" />

            </footer>
        </form>
    </body>
</html>




