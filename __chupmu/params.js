

const EXT_NAME = "chupmu"
const DB_NAME = 'chupmuDb';
const DB_VERSION = 1;
const DB_STORE_NAME = 'voz_test_db.12345';

const DEFAULT_SETTINGS = {
    "tooltipCss": `.tooltip {
      position: relative;
      display: inline-block;
      border-bottom: 1px dotted black;
    }
    
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 120px;
      background-color: black;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px 0;
    
      /* Position the tooltip */
      position: absolute;
      z-index: 1;
    }
    
    .tooltip:hover .tooltiptext {
      visibility: visible;
    }`,
    "dbSources": [
      {
        "dbName": "voz_test_db.12345",
        "dbCss": `.chupmu_css_voz_test_db.12345_xao_lol} {
          background: pink !important;
        }
        .chupmu_css__voz_test_db.12345_ga_con} {
          background: green !important;
        }
        .chupmu_css__voz_test_db.12345_hieu_biet} {
          background: blue !important;
        }
        .chupmu_css__voz_test_db.12345_dot_con_hay_noi} {
          background: red !important;
        }`,
        "dbUrl": "https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json"
      }
    ],
    "action": {
  
    }
  }