const urlRegex = /^https:\/\/voz\.vn\/t\//;
const isHttpOrHttps = /^(http:\/\/|https:\/\/)/i;
const SUPPORTED_PROTOCOL = ["http", "https"];
const getUserFromUrl = /\/([^/]+)\/?$/;
// https://www.w3schools.com/css/css_tooltip.asp

const MSG_EXT_NAME = "chupmu_extension";
const MSG_TARGET_BACKGROUND = "chupmu_background_script";
const MSG_TARGET_CONTENT = "chupmu_content_script";
const MSG_TARGET_SIDEBAR = "chupmu_sidebar_script";

const EXT_NAME = "chupmu"
// const DB_NAME = 'chupmuDb';
// const DB_VERSION = 1;
// const DB_STORE_NAME = 'voz_test_db-12345';

const DEFAULT_SETTINGS = {
  dbSources: [
    {
      dbOnlineQueryUrl: "http://localhost:8080/",
      dbOnlineUserFilesQueryUrl: "http://localhost:8080/user-file-viewer.html",
    }
  ],
  supportedSites: [
    {
      url: "stackoverflow.com",
      contentScript: "./sites/stackoverflow_question/cs-so-quest.js" 
    }
  ]
}

const OLD_DEFAULT_SETTINGS = {
  "dbSources": [
    {
      "dbName": "voz_test_db-12345",
      "description": "A test DB for Voz forum",
      "dbSource": "https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json",
      "onlineRecordUrlPrefix": "chupmu.org/voz_test_db-12345/userid=",
      "urls": [
        "https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/",
        "voz.vn/t/"
      ],
      "tags": {
        "0": {
          "tagId": "0",
          "description": "Xao lol",
          "tagname": "xao_lol"
        },
        "1": {
          "tagId": "1",
          "description": "Ga Con",
          "tagname": "ga_con"
        },
        "2": {
          "tagId": "2",
          "description": "Hieu Biet",
          "tagname": "hieu_biet"
        },
        "3": {
          "tagId": "3",
          "description": "Dot Con Hay Noi",
          "tagname": "dot_con_hay_noi"
        }
      },
      "dbCss": `.chupmu_css__voz_test_db-12345__xao_lol {
        background: pink !important;
      }
      .chupmu_css__voz_test_db-12345__ga_con {
        background: green !important;
      }
      .chupmu_css__voz_test_db-12345__hieu_biet {
        background: blue !important;
      }
      .chupmu_css__voz_test_db-12345__dot_con_hay_noi {
        background: red !important;
      }
      .tooltip {
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
      }`
    }
  ],
  "action": {

  }
}