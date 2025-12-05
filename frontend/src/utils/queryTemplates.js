/**
 * Template SQL untuk setiap grup query
 */

// Template berisi placeholder:
// - {IDS} akan diganti dengan daftar ID dalam format 'id1','id2','id3'
// - {YARD_LOC} akan diganti dengan nilai yard_loc (khusus grup reopen_door)

const QUERY_TEMPLATES = {
  // Reopen Door
  reopen_door: `UPDATE db_wms.receiving
SET status='inprocess'
WHERE receiving_number IN ({IDS});`,

  // Uncheckin
  uncheckin: `UPDATE SPIDSTGEXML.dbo.ORDER_LINE_SEG
SET MANDTE = NULL, 
    TOT_PLN_PAL_QTY = NULL, 
    DISTRO_TYP = NULL, 
    ASSET_TYP = NULL
WHERE ORDNUM IN ({IDS});

UPDATE SPIDSTGEXML.dbo.ORDER_SEG
SET SLOT = NULL 
WHERE ORDNUM IN ({IDS});`,

  // Validasi Bundle
  validasi_bundle: `-- 10.6.0.6\\newjda
SELECT 
    MainSKU AS SKUBundle, 
    BOMSKU AS SKUComponent, 
    BOMQty AS Quantity, 
    shop_name AS Brand, 
    marketplace_name AS SalesChannel, 
    StartDate, 
    EndDate, 
    CheckBundle, 
    ID, 
    CreatedBy,
    CreatedDate
FROM Flexo_db_view.dbo.View_Sys_BOM 
WHERE MainSKU IN ({IDS})
  AND EndDate > GETDATE();

-- CEK SUDAH ADA ORDER BELUM
SELECT so.PartnerId, so.SystemRefId AS OrderNumber, sol.ItemId AS SKUBundle 
FROM Flexo_Db.dbo.SalesOrderLine sol
LEFT JOIN Flexo_Db.dbo.SalesOrder so
    ON so.SystemRefId = sol.SystemRefId
WHERE ItemId IN ({IDS});`,

  // Validasi Supplementary
  validasi_supplementary: `SELECT ItemID AS MainSKU, Supplementary AS GiftSKU, SupplementaryQty, StartDate, EndDate, marketplace_name AS MarketPlace, shop_name AS Brand, CreatedBy, CreatedAt, id  FROM Flexo_db_view.dbo.View_Supplement where 
ItemID IN ({IDS}) 
and EndDate >= DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0) order by ID asc;`,

  // Validasi Gift
  validasi_gift: `select id, ValueStart, ValueEnd, StartDate, EndDate, MainSKU, GiftSKU, GiftQty, LimitSummary AS Limit, ItemLimit AS Limit, marketplace_name AS SalesChannel, shop_name AS Brand, GiftLineNumber, CreatedBy
 from Flexo_db_view.dbo.View_Gift_HL where GiftSKU IN ({IDS}) 
 AND EndDate >= DATEADD(MINUTE, DATEDIFF(MINUTE, 0, GETDATE()), 0);`,

  // Query IN (Custom Only)
  query_in_custom: `IN ({IDS})`,

  delete_by_id: `
  -- server 10.6.0.6\\newjda
  DELETE FROM Flexo_Db.dbo.SalesOrderLine WHERE SystemRefId IN ({IDS});
  DELETE FROM Flexo_Db.dbo.SalesOrder WHERE SystemRefId IN ({IDS});
  DELETE FROM flexo_api.dbo.ORDER_LINE_SEG WHERE ordnum IN ({IDS});
  DELETE FROM WMSPROD.dbo.ord_line WHERE ordnum IN ({IDS});
  DELETE FROM WMSPROD.dbo.ord WHERE ordnum IN ({IDS});
  
    -- server 10.6.0.6\\jda
  DELETE FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG WHERE ORDNUM IN ({IDS});
  DELETE FROM SPIDSTGEXML.dbo.ORDER_SEG WHERE ORDNUM IN ({IDS});
  DELETE FROM SPIDSTGJDANew.dbo.ORDER_LINE_SEG WHERE ORDNUM IN ({IDS});
  DELETE FROM SPIDSTGJDANew.dbo.ORDER_SEG WHERE ORDNUM IN ({IDS});
  `,

  delete_duplikat: `-- 10.6.0.6\\newjda
WITH Duplikat AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY ORDNUM, ORDLIN ORDER BY ENTDTE, ORDLIN) AS rn
    FROM flexo_api.dbo.ORDER_LINE_SEG
    WHERE ORDNUM IN ({IDS})
)
DELETE FROM Duplikat
WHERE rn > 1;

-- 10.6.0.6\\jda
WITH Duplikat AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY ORDNUM, ORDLIN ORDER BY ENTDTE, ORDLIN) AS rn
    FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG
    WHERE ORDNUM IN ({IDS})
)
DELETE FROM Duplikat
WHERE rn > 1;`,

  update_dtmcrt_entdte: `UPDATE SPIDSTGEXML.dbo.ORDER_SEG
SET
    ENTDTE = DATEADD(
                DAY,
                DATEDIFF(DAY, ENTDTE, '{TARGET_DATE}'),
                ENTDTE
             ),
    STATUS = NULL,
    TRANSFERDATE = NULL
WHERE ORDNUM IN ({IDS});

UPDATE Flexo_Db.dbo.SalesOrder
SET
    DtmCrt = DATEADD(
                DAY,
                DATEDIFF(DAY, DtmCrt, '{TARGET_DATE}'),
                DtmCrt
             )
WHERE SystemRefId IN ({IDS});`,

  replace_sku: `-- 10.6.0.6\\Newjda
UPDATE Flexo_Db.dbo.SalesOrderLine 
SET ItemId = '{SKUBARU}'
WHERE SystemRefId IN ({IDS}) AND ItemId IN ({SKULAMA});

UPDATE WMSPROD.dbo.ord_line 
SET prtnum = '{SKUBARU}'
WHERE ordnum IN ({IDS}) AND prtnum IN ({SKULAMA});

UPDATE flexo_api.dbo.ORDER_LINE_SEG 
SET PRTNUM = '{SKUBARU}'
WHERE ordnum IN ({IDS}) AND prtnum IN ({SKULAMA});

-- 10.6.0.6\\jda
UPDATE SPIDSTGEXML.dbo.ORDER_LINE_SEG 
SET PRTNUM = '{SKUBARU}'
WHERE ORDNUM IN ({IDS}) AND prtnum IN ({SKULAMA});

UPDATE SPIDSTGJDANew.dbo.ORDER_LINE_SEG 
SET PRTNUM = '{SKUBARU}'
WHERE ORDNUM IN ({IDS}) AND prtnum IN ({SKULAMA});`,
};

/**
 * Mendapatkan template SQL berdasarkan grup
 * @param {string} groupId - ID grup query
 * @returns {string} Template SQL
 */
export const getTemplateForGroup = (groupId) => {
  const template = QUERY_TEMPLATES[groupId];
  if (!template) {
    throw new Error(`Template untuk grup '${groupId}' tidak ditemukan`);
  }
  return template;
};

export default QUERY_TEMPLATES; 