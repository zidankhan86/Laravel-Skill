UPDATE settings SET value=JSON_SET(value, '$.websiteDesign', 'editorial'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteDesign')=0;
UPDATE settings SET value=JSON_SET(value, '$.websiteDensity', 'comfortable'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteDensity')=0;
UPDATE settings SET value=JSON_SET(value, '$.websiteCorners', 'rounded'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteCorners')=0;
UPDATE settings SET value=JSON_SET(value, '$.websiteMotion', 'subtle'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteMotion')=0;
UPDATE settings SET value=JSON_SET(value, '$.studioPortraitShape', 'oval'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.studioPortraitShape')=0;
UPDATE settings SET value=JSON_SET(value, '$.executivePortraitSide', 'left'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.executivePortraitSide')=0;
