UPDATE settings
SET value = JSON_SET(value, '$.heroPortrait', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(value, '$.portrait')), '')),
    version = version + 1
WHERE id = 'settings' AND JSON_CONTAINS_PATH(value, 'one', '$.heroPortrait') = 0;

UPDATE settings
SET value = JSON_SET(value, '$.journeyPortrait', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(value, '$.portrait')), '')),
    version = version + 1
WHERE id = 'settings' AND JSON_CONTAINS_PATH(value, 'one', '$.journeyPortrait') = 0;
