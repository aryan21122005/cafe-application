SET FOREIGN_KEY_CHECKS=0;

SET @fk_users_address := (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'address_id'
      AND REFERENCED_TABLE_NAME = 'address'
    LIMIT 1
);
SET @drop_fk_users_address := IF(
    @fk_users_address IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE users DROP FOREIGN KEY ', @fk_users_address)
);
PREPARE stmt FROM @drop_fk_users_address;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_users_personal := (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'personal_details_id'
      AND REFERENCED_TABLE_NAME = 'personal_details'
    LIMIT 1
);
SET @drop_fk_users_personal := IF(
    @fk_users_personal IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE users DROP FOREIGN KEY ', @fk_users_personal)
);
PREPARE stmt FROM @drop_fk_users_personal;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE address MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE personal_details MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE academic_info MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE work_experience MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

SET @users_table_exists := (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
);

SET @fk_exists_users_address := (
    SELECT COUNT(*)
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'address_id'
      AND REFERENCED_TABLE_NAME = 'address'
);
SET @add_fk_users_address := IF(
    @users_table_exists = 0 OR @fk_exists_users_address > 0,
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT fk_users_address_id FOREIGN KEY (address_id) REFERENCES address(id)'
);
PREPARE stmt FROM @add_fk_users_address;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists_users_personal := (
    SELECT COUNT(*)
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'personal_details_id'
      AND REFERENCED_TABLE_NAME = 'personal_details'
);
SET @add_fk_users_personal := IF(
    @users_table_exists = 0 OR @fk_exists_users_personal > 0,
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT fk_users_personal_details_id FOREIGN KEY (personal_details_id) REFERENCES personal_details(id)'
);
PREPARE stmt FROM @add_fk_users_personal;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS=1;
