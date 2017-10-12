<?php
/**
 * @created 11.10.2017
 * @author lbraun
 * @licence MIT
 */

require_once 'simple_html_dom.php';
require_once 'Crawler.php';

$urls = [
    //'https://www.google.de',
    'http://www.ladies.de/Home',
];

$crawler = Crawler::getInstance( $urls );
$foundEncodedUrls = $crawler->crawlAll( 60, false, true );
$foundUrls = decodeAllUrls( $foundEncodedUrls );

var_dump( '<pre>', $foundUrls, '</pre>' );

function decodeAllUrls( $urls ) {
    $foundUrls = [];

    if ( !is_array( $urls ) ) {
        return $foundUrls;
    }

    foreach ( $urls as $url => $value ) {
        $foundUrls[urldecode( $url )] = $value;

        if ( is_array( $value ) ) {
            $foundUrls[urldecode( $url )] = decodeAllUrls( $value );
        }
    }

    return $foundUrls;
}