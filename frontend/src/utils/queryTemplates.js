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
  validasi_bundle: `SELECT
    v.MainSKU      AS SKUBundle,
    v.BOMSKU       AS SKUComponent,
    v.BOMQty       AS Quantity,
    v.shop_name    AS Brand,
    STRING_AGG(v.marketplace_name, ', ') AS SalesChannel,
    MIN(v.StartDate) AS StartDate,
    v.EndDate,
    v.CheckBundle,
    MIN(v.ID)        AS ID,
    MAX(v.CreatedBy) AS CreatedBy,
    v.CreatedDate
FROM (
    SELECT DISTINCT
        MainSKU,
        BOMSKU,
        BOMQty,
        shop_name,
        marketplace_name,
        StartDate,
        EndDate,
        CheckBundle,
        ID,
        CreatedBy,
        CreatedDate
    FROM Flexo_db_view.dbo.View_Sys_BOM
    WHERE MainSKU IN ({IDS})
      AND EndDate >= GETDATE()
) v
GROUP BY
    v.MainSKU,
    v.BOMSKU,
    v.BOMQty,
    v.shop_name,
    v.EndDate,
    v.CreatedDate,
    v.CheckBundle
ORDER BY ID ASC;

-- CEK SUDAH ADA ORDER BELUM
SELECT so.PartnerId, so.SystemRefId AS OrderNumber, sol.ItemId AS SKUBundle, so.OrderDate
FROM Flexo_Db.dbo.SalesOrderLine sol
LEFT JOIN Flexo_Db.dbo.SalesOrder so
    ON so.SystemRefId = sol.SystemRefId
WHERE ItemId IN ({IDS})
ORDER BY so.OrderDate DESC;`,

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
;WITH CTE AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY ORDNUM, PRTNUM, ORDLIN, ORDSLN, ORDQTY
            ORDER BY ENTDTE DESC
        ) AS rn
    FROM flexo_api.dbo.ORDER_LINE_SEG
    WHERE ORDNUM IN ({IDS})
)
DELETE FROM CTE
WHERE rn > 1;

-- 10.6.0.6\\jda
;WITH CTE AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY ORDNUM, PRTNUM, ORDLIN, ORDSLN, ORDQTY
            ORDER BY ENTDTE DESC
        ) AS rn
    FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG
    WHERE ORDNUM IN ({IDS})
)
DELETE FROM CTE
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

  // Template Pero
  template_pero: `SELECT
    ROW_NUMBER() OVER (ORDER BY SO.SystemRefId) AS [No],
    SO.OrderDate AS  [Order Date],
    SO.EntityId AS  [Sales Order],
    SO.CustName AS  [Customer],
    SO.DeliveryAddress AS [Alamat],
    SO.CustPhone1 AS [Telp],
    '' AS [Kode Pos],
    SOL.ItemId AS  [Code SKU],
    SOL.ItemName AS [Deskripsi],
    SOL.QtyOrder AS  [Quantity],
    '' AS [Schedule Pickup (date & time)],
    SO.Awb AS [ AWB],
    SO.TransporterCode [Transporter],
    odl.ShipmentDateline AS [SLA Batal],
    CASE
        WHEN LXML.prtnum IS NULL OR LXML.prtnum = '' THEN 'Pending'
        WHEN prt.prtnum IS NULL THEN 'Invalid SKU'
        WHEN HJDA.adddte IS NOT NULL THEN 'Bisa Diproses'
        WHEN SO.OrderStatus IS NOT NULL THEN SO.OrderStatus
        ELSE 'Aman'
    END AS [Remark]
FROM Flexo_Db.dbo.SalesOrder SO
LEFT JOIN Flexo_Db.dbo.Order_Dateline odl 
    ON SO.EntityId = odl.EntityID
LEFT JOIN Flexo_Db.dbo.SalesOrderLine SOL 
    ON SOL.SystemRefId = SO.SystemRefId
LEFT JOIN [10.6.0.6\jda].SPIDSTGEXML.dbo.ORDER_SEG HXML 
    ON HXML.ORDNUM = SO.SystemRefId
LEFT JOIN [10.6.0.6\jda].SPIDSTGEXML.dbo.ORDER_LINE_SEG LXML 
    ON LXML.ORDNUM = SO.SystemRefId
LEFT JOIN WMSPROD.dbo.prtmst prt 
    ON LXML.PRTNUM = prt.prtnum
LEFT JOIN WMSPROD.dbo.ord HJDA
    ON SO.SystemRefId = HJDA.ordnum
    AND HXML.ORDNUM = HJDA.ordnum
LEFT JOIN WMSPROD.dbo.ord_line LJDA 
    ON LJDA.ORDNUM = SO.SystemRefId
    AND LXML.prtnum = LJDA.prtnum
WHERE SO.SystemRefId IN ({IDS});`,

  // Query SO & SOL
  query_so_sol: `SELECT SO.SystemId, so.MerchantName, so.SystemRefId, sol.ItemId, sol.ItemName, sol.QtyOrder, so.OrderDate, so.Awb, so.DtmCrt, so.OrderStatus, so.PaymentDate, so.origin, so.FulfilledByFlexo 
FROM Flexo_Db.dbo.SalesOrder so
LEFT JOIN Flexo_Db.dbo.SalesOrderLine sol 
    ON SOL.SystemRefId = SO.SystemRefId
WHERE So.SystemRefId IN ({IDS});`,

  // Query XML dan XML Line
  query_xml_xml_line: `SELECT 
      '' AS [Client ID],
      hxml.ORDNUM,
      lxml.PRTNUM,
      lxml.ORDLIN,
      lxml.ORDSLN,
      lxml.ORDQTY,
      lxml.INVSTS_PRG,
      lxml.CANCELLED_FLG,
      hxml.ORDTYP,
      hxml.ENTDTE,
      hxml.BTCUST,
      lxml.MANDTE, 
      lxml.TOT_PLN_PAL_QTY, 
      lxml.DISTRO_TYP, 
      lxml.ASSET_TYP,
      hxml.SLOT,
      hxml.STATUS,
      hxml.TRANSFERDATE
FROM [SPIDSTGEXML].[dbo].[ORDER_SEG] hxml
LEFT JOIN SPIDSTGEXML.dbo.ORDER_LINE_SEG lxml 
    ON LXML.ORDNUM = hxml.ORDNUM
WHERE hxml.ordnum IN ({IDS});`,

  // Line Live
  line_live: `SELECT 
      '' AS [Client ID],
      hxml.ORDNUM,
      lxml.PRTNUM,
      lxml.ORDLIN,
      lxml.ORDSLN,
      lxml.ORDQTY,
      lxml.INVSTS_PRG,
      lxml.CANCELLED_FLG,
      hxml.ORDTYP
FROM [SPIDSTGEXML].[dbo].[ORDER_SEG] hxml
LEFT JOIN SPIDSTGEXML.dbo.ORDER_LINE_SEG lxml 
    ON LXML.ORDNUM = hxml.ORDNUM
WHERE hxml.ordnum IN ({IDS});`,

  // Manifest Order
  manifest_order: `SELECT 
    so.SystemId,
    mh.ManifestNumber,
    mo.AWB,
    mo.OrderNumber,
    mo.SystemRefID,
    mo.CreatedAt,
    mo.Transporter,
    mh.HandOverDate,
    mh.CreatedBy
FROM FlexoWebApp.dbo.ManifestOrder AS mo WITH (NOLOCK)
LEFT JOIN FlexoWebApp.dbo.ManifestHeader AS mh WITH (NOLOCK)
    ON mo.ManifestID = mh.ID
LEFT JOIN Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
    ON mo.SystemRefID = so.SystemRefId
WHERE mo.CreatedAt >= '{START_DATE}'
  AND mo.CreatedAt < '{END_DATE}'
  AND so.SystemId <> 'MPUP'
ORDER BY mo.CreatedAt ASC;`,

  // Data Cekin
  data_cekin: `SELECT distinct ols.ORDNUM as OrderNumber		
		,so.OrderStatus
      ,ols.[ORDLIN]		
      ,case when olr.Ordnum is not null then olr.[ItemIDReplace] else ols.PRTNUM end as ItemID		
      ,case when olr.Ordnum is not null then olr.UserCheckin else ols.DISTRO_TYP  end as UPC		
      , case when olr.Ordnum is not null then olr.[QtyReplace] else ols.ORDQTY end as OrderQty		
	  ,case when olr.Ordnum is not null then olr.QtyCheckin else ols.TOT_PLN_PAL_QTY end as CheckInQty	
      , case when olr.Ordnum is not null then olr.CheckinDate else ols.[MANDTE]  end  as CheckinDate		
	  ,Case	
	  when olr.Isreplacement=1 then 'REPLACE'	
	  when TOT_PLN_PAL_QTY = ORDQTY then 'OK'	
	  when olr.QtyCheckin=QtyReplace then 'OK'	
	  else 'ERROR' end as QtyCheck	
	  ,'Online' as 'OrderType'	
	  ,olr.IsReplacement	
	  ,olr.ItemID as 'ItemOriginal'	
	  ,olr.Qty as 'QtyOriginal'	
  FROM [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] ols WITH(NOLOCK)		
  LEFT OUTER JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_REPLACE] olr WITH(NOLOCK) on ols.ORDNUM= olr.Ordnum and ols.ORDLIN = olr.Ordlin 		
  left outer join Flexo_db.dbo.SalesOrder so WITH(NOLOCK) on ols.ORDNUM=so.SystemRefId		
  Left outer join Flexo_db.dbo.salesorderprint sp WITH(NOLOCK) on ols.ordnum = sp.systemrefid		
  where (ols.MANDTE >='{START_DATE}' and ols.MANDTE < '{END_DATE}') and so.SystemId <>'MPUP'`,
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