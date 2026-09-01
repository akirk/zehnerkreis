<?php
/**
 * Zehnerkreis, a scorepad for the quiz game Smart 10.
 *
 * The whole game lives in the browser (localStorage), so this template only
 * ships the skeleton that assets/zehnerkreis.js fills in.
 */

if ( ! defined( 'DONOTCACHEPAGE' ) ) {
    define( 'DONOTCACHEPAGE', true );
}

wp_app_enqueue_style( 'zehnerkreis', \Zehnerkreis\App::asset_url( 'zehnerkreis.css' ), [], \Zehnerkreis\App::asset_version( 'zehnerkreis.css' ) );
wp_app_enqueue_script( 'zehnerkreis', \Zehnerkreis\App::asset_url( 'zehnerkreis.js' ), [], \Zehnerkreis\App::asset_version( 'zehnerkreis.js' ), true );
?>
<!DOCTYPE html>
<html <?php wp_app_language_attributes(); ?>>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title><?php echo wp_app_title( 'Zehnerkreis' ); ?></title>
    <?php wp_app_head(); ?>
</head>
<body class="zehnerkreis">
    <?php wp_app_body_open(); ?>

    <main id="zehnerkreis-app">
        <header class="zk-head">
            <h1>Zehnerkreis</h1>
            <p class="zk-round" id="zk-round"></p>
        </header>

        <section class="zk-setup" id="zk-setup" hidden>
            <h2>Wer spielt?</h2>
            <label class="zk-field">
                <span>Name 1</span>
                <input type="text" id="zk-name-0" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="next">
            </label>
            <label class="zk-field">
                <span>Name 2</span>
                <input type="text" id="zk-name-1" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="done">
            </label>
            <fieldset class="zk-modes" id="zk-modes">
                <legend>Spiellänge</legend>
                <label><input type="radio" name="zk-mode" id="zk-mode-short" value="short"> Kurz — 3 Runden, dann die Bonusrunde</label>
                <label><input type="radio" name="zk-mode" id="zk-mode-long" value="long"> Lang — 10 Runden, Bonus bei 5 und 10</label>
            </fieldset>

            <button type="button" class="zk-btn zk-next" data-action="start">
                <span class="zk-btn-label">Weiter</span>
            </button>
        </section>

        <div id="zk-game">
            <p class="zk-last" id="zk-last" hidden></p>

            <ol class="zk-players" id="zk-players"></ol>

            <p class="zk-turn" id="zk-turn"></p>

            <div class="zk-actions" id="zk-start" hidden>
                <button type="button" class="zk-btn zk-next" data-action="clock">
                    <span class="zk-btn-label">Zeit starten</span>
                    <span class="zk-btn-note" id="zk-note-clock"></span>
                </button>
            </div>

            <div class="zk-actions" id="zk-actions">
                <button type="button" class="zk-btn zk-correct" data-action="correct">
                    <span class="zk-btn-label"><span class="zk-btn-who" id="zk-who-correct"></span>Richtig</span>
                    <span class="zk-btn-note" id="zk-note-correct"></span>
                </button>
                <button type="button" class="zk-btn zk-wrong" data-action="wrong">
                    <span class="zk-btn-label"><span class="zk-btn-who" id="zk-who-wrong"></span>Falsch</span>
                    <span class="zk-btn-note" id="zk-note-wrong"></span>
                </button>
                <button type="button" class="zk-btn zk-pass" data-action="pass">
                    <span class="zk-btn-label"><span class="zk-btn-who" id="zk-who-pass"></span>Aussteigen</span>
                    <span class="zk-btn-note" id="zk-note-pass"></span>
                </button>
            </div>

            <div class="zk-over" id="zk-over" hidden>
                <p class="zk-winner" id="zk-winner"></p>
                <button type="button" class="zk-btn zk-next" data-action="again">
                    <span class="zk-btn-label">Neues Spiel</span>
                </button>
            </div>
        </div>

        <footer class="zk-foot" id="zk-foot">
            <button type="button" class="zk-link" data-action="undo" id="zk-undo">Rückgängig</button>
            <button type="button" class="zk-link" data-action="names">Namen</button>
            <button type="button" class="zk-link" data-action="reset">Neues Spiel</button>
        </footer>
    </main>

    <?php wp_app_body_close(); ?>
</body>
</html>
