<?php
/**
 * @created 11.10.2017
 * @author lbraun
 * @licence MIT
 */

/**
 * Class Crawler
 */
class Crawler {

    protected static $instance = null;

    protected $urls = [];

    protected $crawledUrls = [];

    protected $foundUrls = [];

    protected $secondTry = false;

    public static function getInstance( array $urls = [] ) {
        if ( !self::$instance ) {
            self::$instance = new self( $urls );
        }

        return self::$instance;
    }

    protected function __construct( array $urls ) {
        $this->urls = $urls;

        return $this;
    }

    protected function __clone() {
    }

    public function crawlAll( int $maxExecTime = 0, bool $withCrawledUrls = false, bool $useCurl = false ) {
        $origMaxExecTime = ini_get( 'max_execution_time' );

        if ( $maxExecTime > 0 ) {
            ini_set( 'max_execution_time', $maxExecTime );
        }

        foreach ( $this->urls as $url ) {
            if ( !$this->crawlSite( $url, $useCurl ) ) {
                if ( !$this->crawlSite( $url, !$useCurl ) ) {
                    echo $url . '<br />';
                }
            }
        }

        ini_set( 'max_execution_time', $origMaxExecTime );

        if ( $withCrawledUrls ) {
            return [ 'crawled-urls' => $this->crawledUrls, 'found-urls' => $this->foundUrls ];
        }

        return $this->foundUrls;
    }

    public function perfectUrl( $url, $base ) {
        $parsedBase = parse_url( $base );

        if ( isset( $parsedBase['path'] )
            && (
                ( $parsedBase['path'] !== '/' && $parsedBase['path'] !== '' )
                || $parsedBase['path'] == '' )
        ) {
            $scheme = $parsedBase['scheme'];

            if ( $parsedBase['scheme'] == '' ) {
                $scheme = 'http';
            }

            $base = $scheme . '://' . $parsedBase['host'] . '/';
        }


        $url = substr( $url, 0, 2 ) == '//' ? 'http:' . $url : $url;
        $url = substr( $url, 0, 4 ) !== 'http' ? $this->rel2abs( $url, $base ) : $url;

        return $url;
    }

    public function rel2abs( $rel, $base ) {
        if ( parse_url( $rel, PHP_URL_SCHEME ) != '' ) {
            return $rel;
        }

        if ( $rel[0] == '#' || $rel[0] == '?' ) {
            return $base . $rel;
        }

        $parsedBase = parse_url( $base );
        $path = $parsedBase['path'] ?? '';
        $host = $parsedBase['host'] ?? '';
        $scheme = $parsedBase['scheme'] ?? '';

        $path = preg_replace( '#/[^/]*$#', '', $path );

        if ( $rel[0] == '/' ) {
            $path = '';
            $rel = str_split( $rel );
            array_shift( $rel );
            $rel = implode( '', $rel );
        }

        $abs = $host . $path . '/' . $rel;
        $abs = str_replace( '../', '', $abs );

        return $scheme . '://' . $abs;
    }

    public function crawlSite( string $url, bool $useCurl = false ) {
        $encodedUrl = urlencode( $url );

        if ( array_key_exists( $encodedUrl, $this->crawledUrls ) && $this->secondTry && !$this->crawledUrls[$encodedUrl] ) {
            $this->secondTry = false;

            return false;
        }

        if ( $useCurl ) {
            $html = $this->curlGetHtml( $url );
        } else {
            $contextOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ];
            $context = stream_context_create( $contextOptions );
            $html = $this->fileGetHtml( $url, false, $context, 0 );
        }

        $this->crawledUrls[$encodedUrl] = date( 'YmdHis' );

        if ( !$html || empty( $html ) ) {
            if ( $this->secondTry ) {
                $this->crawledUrls[$encodedUrl] = false;
            }

            $this->secondTry = true;

            return false;
        }

        foreach ( $html->find( 'a' ) as $link ) {
            if ( substr( $url, 0, 4 ) === 'mail' ) {
                continue;
            }

            if ( substr( $url, 0, 4 ) === 'java' ) {
                continue;
            }

            $linkUrl = $this->perfectUrl( $link->href, $url );
            $encodedLinkUrl = urlencode( $linkUrl );

            if ( $linkUrl != '' && substr( $linkUrl, 0, 4 ) !== 'mail' && substr( $linkUrl, 0, 4 ) != 'java' && ( !array_key_exists( $url, $this->foundUrls ) || !array_key_exists( $encodedLinkUrl, $this->foundUrls[$url] ) ) ) {
                $this->foundUrls[$url][$encodedLinkUrl] = 1;
            }
        }

        return true;
    }

    public function get( $property ) {
        return $this->{$property} ?? null;
    }

    public function set( $property, $value ) {
        $this->{$property} = $value;

        return $this;
    }

    /**
     * @param $url
     * @param bool $useIncludePath
     * @param null $context
     * @param int $offset
     * @param int $maxLen
     * @param bool $lowercase
     * @param bool $forceTagsClosed
     * @param string $targetCharset
     * @param bool $stripRN
     * @param string $defaultBRText
     * @param string $defaultSpanText
     * @return bool|simple_html_dom
     *
     * "Ich habe sowieso schon unruhig geschlafen und Albträume gehabt." - "Ich auch, meine Frau hat sich gerade die Haare geschnitten." - "Oben oder unten?"
     */

    protected function fileGetHtml( $url, $useIncludePath = false, $context = null, $offset = -1, $maxLen = -1, $lowercase = true, $forceTagsClosed = true, $targetCharset = DEFAULT_TARGET_CHARSET, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT ) {
        // We DO force the tags to be terminated.
        $dom = new simple_html_dom( null, $lowercase, $forceTagsClosed, $targetCharset, $stripRN, $defaultBRText, $defaultSpanText );
        // For sourceforge users: uncomment the next line and comment the retreive_url_contents line 2 lines down if it is not already done.
        $contents = file_get_contents( $url, $useIncludePath, $context, $offset );
        if ( empty( $contents ) || strlen( $contents ) > MAX_FILE_SIZE ) {
            return false;
        }
        // The second parameter can force the selectors to all be lowercase.
        $dom->load( $contents, $lowercase, $stripRN );

        return $dom;
    }

    protected function curlGetHtml( $url, $lowercase = true, $forceTagsClosed = true, $targetCharset = DEFAULT_TARGET_CHARSET, $stripRN = true, $defaultBRText = DEFAULT_BR_TEXT, $defaultSpanText = DEFAULT_SPAN_TEXT ) {
        $dom = new simple_html_dom( null, $lowercase, $forceTagsClosed, $targetCharset, $stripRN, $defaultBRText, $defaultSpanText );
        $contents = $this->curlGetContent( $url );

        if ( empty( $contents ) || strlen( $contents ) > MAX_FILE_SIZE ) {
            return false;
        }

        $dom->load( $contents, $lowercase, $stripRN );

        return $dom;
    }

    protected function curlGetContent( $url ) {
        $header[0] = "Accept: text/xml,application/xml,application/xhtml+xml, text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5";
        $header[] = "Cache-Control: max-age=0";
        $header[] = "Connection: keep-alive";
        $header[] = "Keep-Alive: 300";
        $header[] = "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7";
        $header[] = "Accept-Language: en-us,en;q=0.5";

        $curl = curl_init();

        curl_setopt( $curl, CURLOPT_URL, $url );
        curl_setopt( $curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36' );
        curl_setopt( $curl, CURLOPT_HTTPHEADER, $header );
        curl_setopt( $curl, CURLOPT_ENCODING, 'gzip,deflate' );
        curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true ); // very important to set it to true, otherwise the content will be not be saved to string

        $contents = curl_exec( $curl ); // execute the curl command
        curl_close( $curl );

        return $contents;
    }
}