UPDATE settings SET value=JSON_SET(value, '$.websiteGreenColor', '#103b2a'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteGreenColor')=0;

UPDATE settings SET value=JSON_SET(value, '$.websiteLimeColor', '#d0f56a'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLimeColor')=0;

UPDATE settings SET value=JSON_SET(value, '$.websiteLavenderColor', '#d8cdf3'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLavenderColor')=0;
