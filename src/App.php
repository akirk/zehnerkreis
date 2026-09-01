<?php

namespace Zehnerkreis;

use WpApp\WpApp;
use WpApp\BaseApp;

class App extends BaseApp {
    public function __construct() {
        $this->app = new WpApp( $this->get_template_dir(), $this->get_url_path(), [
            // A scorepad for a boardgame at the table: no account needed, the
            // whole game state lives in the browser's localStorage.
            'require_login'                => false,
            'show_masterbar_for_anonymous' => false,
            'app_name'                     => 'Zehnerkreis',
            'app_name_textdomain'          => 'zehnerkreis',
            'app_icon'                     => 'dashicons-forms',
            'app_icon_background'          => '#eb6e22',
            'app_icon_color'               => '#fed029',
            'pwa'                          => [
                'name'             => 'Zehnerkreis – Zähler für Smart 10',
                'short_name'       => 'Zehnerkreis',
                'description'      => 'Punktezähler für das Quizspiel Smart 10.',
                'theme_color'      => '#eb6e22',
                'background_color' => '#eb6e22',
                'icons'            => [
                    [
                        'src'   => self::asset_url( 'icon-192.png' ),
                        'sizes' => '192x192',
                        'type'  => 'image/png',
                    ],
                    [
                        'src'     => self::asset_url( 'icon-512.png' ),
                        'sizes'   => '512x512',
                        'type'    => 'image/png',
                        'purpose' => 'any maskable',
                    ],
                ],
                'precache'         => [
                    self::asset_url( 'zehnerkreis.css' ),
                    self::asset_url( 'zehnerkreis.js' ),
                ],
            ],
        ] );
    }

    /**
     * URL of a file in the plugin's assets directory.
     */
    public static function asset_url( string $file ): string {
        return plugins_url( 'assets/' . $file, dirname( __DIR__ ) . '/zehnerkreis.php' );
    }

    /**
     * Cache buster so an edited asset is picked up without a hard reload.
     */
    public static function asset_version( string $file ): string {
        $path = dirname( __DIR__ ) . '/assets/' . $file;

        return file_exists( $path ) ? (string) filemtime( $path ) : '1.0.0';
    }

    protected function get_url_path(): string {
        return 'zehnerkreis';
    }

    protected function get_template_dir(): string {
        return dirname( __DIR__ ) . '/templates';
    }

    protected function setup_database(): void {
        // No server-side storage: the scorepad keeps its state in the browser.
    }

    protected function setup_routes(): void {
        $this->app->route( '' );
    }

    protected function setup_menu(): void {
        // Single screen, nothing to navigate to.
    }

    public function activate(): void {
        flush_rewrite_rules();
    }

    public function deactivate(): void {
        flush_rewrite_rules();
    }
}
