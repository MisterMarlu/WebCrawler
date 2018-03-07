CREATE TABLE IF NOT EXISTS found_urls
(
  id         INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  url        VARCHAR(191) NOT NULL,
  created_at TIMESTAMP    NULL,
  updated_at TIMESTAMP    NULL
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS screenshot_dimensions
(
  id         INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  width      INT       NOT NULL,
  height     INT       NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS screenshot_elements
(
  id          INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  element     VARCHAR(191)             NOT NULL,
  wait_before VARCHAR(191) DEFAULT '0' NOT NULL,
  wait_after  VARCHAR(191) DEFAULT '0' NOT NULL,
  created_at  TIMESTAMP                NULL,
  updated_at  TIMESTAMP                NULL
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS screenshots
(
  id                      INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  url                     VARCHAR(191)           NOT NULL,
  file_path               VARCHAR(191)           NOT NULL,
  name                    VARCHAR(191)           NOT NULL,
  screenshot_dimension_id INT UNSIGNED           NOT NULL,
  created_at              TIMESTAMP              NULL,
  updated_at              TIMESTAMP              NULL,
  CONSTRAINT screenshots_file_path_unique
  UNIQUE (file_path),
  CONSTRAINT screenshots_name_unique
  UNIQUE (name),
  CONSTRAINT screenshots_screenshot_dimension_id_foreign
  FOREIGN KEY (screenshot_dimension_id) REFERENCES screenshot_dimensions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS starting_urls
(
  id           INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  url          VARCHAR(191)           NOT NULL,
  active       TINYINT(1) DEFAULT '0' NOT NULL,
  num_visited  INT DEFAULT '0'        NOT NULL,
  created_at   TIMESTAMP              NULL,
  updated_at   TIMESTAMP              NULL,
  CONSTRAINT starting_urls_url_unique
  UNIQUE (url)
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visited_urls
(
  id         INT UNSIGNED AUTO_INCREMENT
    PRIMARY KEY,
  url        VARCHAR(191) NOT NULL,
  created_at TIMESTAMP    NULL,
  updated_at TIMESTAMP    NULL
)
  ENGINE = InnoDB
  COLLATE = utf8mb4_unicode_ci;

