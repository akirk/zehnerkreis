<?php
/**
 * Plugin Name: Zehnerkreis – Zähler für Smart 10
 * Description: Punktezähler für das Quizspiel Smart 10
 * Version: 1.0.0
 * Author: Alex Kirk
 * Text Domain: zehnerkreis
 * Requires PHP: 7.4
 */

namespace Zehnerkreis;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

// Autoloader for plugin classes.
spl_autoload_register( function( $class ) {
    $prefix = 'Zehnerkreis\\';
    $len = strlen( $prefix );
    if ( strncmp( $prefix, $class, $len ) !== 0 ) {
        return;
    }
    $file = __DIR__ . '/src/' . str_replace( '\\', '/', substr( $class, $len ) ) . '.php';
    if ( file_exists( $file ) ) {
        require $file;
    }
} );

add_action( 'plugins_loaded', function() {
    $app = new App();
    $app->init();
} );

register_activation_hook( __FILE__, function() {
    $app = new App();
    $app->activate();
} );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
