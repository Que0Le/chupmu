from beanie import init_beanie
from fastapi.testclient import TestClient
from httpx import AsyncClient
from models.admin import Admin
from models.student import Student
from models.report_data import ReportData
from tests.conftest import mock_no_authentication

import pytest
import json, time, asyncio
from pprint import pprint

ignored_users = [1043824, 1688616, 1819765, 1655153, 1809722, 1842655, 1437384, 969019, 1515610, 1393003, 1752578, 295900, 1830578, 1783328, 1246067, 1649937, 1813921, 1472639, 1906399, 1758264, 1830058, 1094257, 1496973, 1796717, 1677749, 1672626, 1466059, 252444, 729724, 1790925, 1463918, 1435358, 431820, 1052418, 1404865, 4448, 1838604, 1879400, 1391998, 1696318, 1706913, 905701, 1690716, 1734668, 1719802, 1719804, 1779380, 1798172, 440280, 162567, 1424686, 1751363, 1737403, 1777501, 1798114, 1753477, 1483227, 295836, 1717395, 1798117, 1307103, 1422324, 1430983, 1768423, 1210910, 1825573, 1345589, 1811213, 1685937, 625159, 1696590, 1687481, 1751890, 1568133, 1057657, 1535757, 1768430, 1767463, 17630, 154835, 724198, 1709240, 1701633, 1813123, 658165, 977122, 1439623, 1782892, 1590625, 1863429, 1679423, 1751551, 1746673, 1156011, 1157000, 1704796, 1552242, 483148, 1579109, 1744943, 1689323, 1802235, 1481976, 1792834, 480620, 1557845, 1732033, 1365838, 1423085, 1423201, 384108, 722389, 1045893, 1728347, 1686536, 1907005, 1780785, 1469290, 1681916, 1556441, 1810836, 1219842, 1218295, 884329, 983272, 248872, 1684575, 1673544, 1764624, 1536366, 1824229, 1767617, 1572469, 1750079, 1087026, 1617373, 443920, 1478976, 972274, 1718399, 1793097, 451896, 3407, 1689359, 1340912, 1672788, 1490163, 1482834, 1789675, 916108, 1717814, 1199342, 1459449, 1580126, 560992, 1695457, 136354, 495932, 1317061, 457880, 1695296, 1365422, 1775523, 1880320, 1751810, 1796996, 1576054, 1293071, 1664865, 1737610, 1745427, 141225, 1678183, 1190475, 601201, 1713418, 499888, 1015369, 826633, 1694718, 1791563, 1427019, 400328, 1374621, 1692274, 1776974, 1722959, 1454529, 1622877, 1655069, 1214455, 938755, 737746, 148353, 1684926, 434640, 1566262, 247396, 1771677, 1107965, 516728, 631120, 1726514, 1493418, 1809394, 1894680, 1735190, 1786558, 856006, 1689628, 1746889, 1786059, 1293971, 1454826, 1497762, 388692, 1784306, 1273694, 1087399, 1418436, 473024, 1776759, 134770, 1673737, 982620, 1139893, 775357, 1745849, 1075590, 1488732, 1479950, 1421356, 242972, 1696954, 1856346, 1214275, 1827357, 1708223, 1615737, 1810872, 431960, 1264815, 1487587, 1614941, 1489166, 1675858, 1599717, 1270264, 1721773, 1814407, 1010138, 480372, 521596, 1014750, 1682585, 1463540, 1456570, 1754666, 1641165, 1448554, 289068, 1167473, 1095589, 1426802, 1742742, 353376, 1737108, 861742, 1734871, 1402053, 1707837, 1873507, 1764189, 1030878, 1729252, 1632365, 1628357, 1126348, 980039, 1111630, 42511, 1701042, 224980, 1743789, 590062, 1750542, 362908, 1417952, 1269225, 982233, 1736772, 1729121, 1613329, 344200, 1703540, 1046883, 1793870, 1462978, 1449263, 1769373, 1737255, 1560433, 1202738, 991437, 1411957, 1768425, 370420, 1725609, 975385, 1722684, 1468503, 1488178, 1425208, 1614469, 1696776, 1795299, 1697184, 1447656, 1827856, 1892682, 1508213, 1775674, 1725310, 1461502, 1642817, 1785573, 1763759, 1450365, 1640681, 1466378, 1683284, 1741110, 1623893, 1346941, 1249925, 1693017, 1811582, 415672, 1453583, 1854907, 1858801, 1793417, 1223609, 1596721, 18889, 1700163, 102270, 1674123, 1661753, 403144, 1763977, 1734297, 1413150, 5322, 598, 1722246, 1554313, 1697334, 1353038, 1699874, 1672946, 1132079, 21722, 1843277, 1728562, 1751615, 1792148, 1697019, 1319024, 1764019, 1238423, 1191383, 1538141, 1752168, 1776945, 1687600, 1499669, 1450644, 1456448, 1446238, 701356, 1602717, 1738689, 780700, 1229154, 523720, 1601353, 1230496, 1042098, 1014475, 1722533, 1687296, 969485, 1741901, 1729910, 307320, 1819968, 1651873, 1300466, 1477907, 1806255, 1478570, 1685082, 1627589, 1307185, 49908, 1557157, 1274871, 1031991, 1018283, 1181, 1852436, 757783, 1155246, 1075756, 1768427, 1075614, 1162776, 745219, 1214917, 1766557, 1159940, 1335824, 1755442, 1709334, 1425920, 999986, 1142587, 934411, 212708, 1714818, 1800364, 63957, 1783545, 70050, 88, 1247077, 1812258, 1616949, 1703966, 1726715, 1590429, 1181907, 1664293, 1269687, 1674149, 1704994, 1732995, 947896, 38105, 1353336, 1834941, 1160252, 379728, 1055568, 1040840, 1689536, 1835428, 1000053, 1464092, 1336737, 1764073, 1679297, 665470, 1687879, 28748, 53839, 1835125, 1010975, 1768288, 182811, 1686159, 73581, 1456561, 753097, 1228911, 1687069, 1590601, 1523301, 1176342, 1062492, 1734111, 1694540, 2087, 1719602, 942211, 1754627, 883621, 14642, 1863247, 1820070, 1125801, 1550885, 1468451, 903580, 1837536, 1743507, 1359028, 1162239, 1574341, 1869687, 1129679, 95305, 1817197, 995821, 1168464, 995877, 4095, 395856, 1213237, 1840568, 182037, 1671760, 1878451, 1350507, 1845020, 1671423, 1135, 978974, 1677869, 1109650, 1683661, 1697880, 446056, 25336, 1728573, 1670844, 1741001, 1053079, 1213133, 1175858, 1697160, 1798132, 407788, 1797718, 1768424, 1693134, 1756681, 1795545, 1160381, 23523, 1890084, 505084, 1736667, 1806545, 366432, 481044, 402660, 1767481, 1680091, 1741103, 1270745, 1163, 1750988, 1897, 1697290, 1850463, 1806954, 1460432, 1107413, 1766569, 1419205, 1579041, 1700821, 477876, 93350, 1798264, 1282651, 1509733, 141213, 1766736, 1797746, 1391058, 1056669, 1480070, 1083661, 1708365, 1600389, 1786402, 428168, 675706, 1340365, 527428, 1486848, 1373711, 282912, 253264, 1780924, 1390643, 1687976, 1312355, 1170830, 1743386, 83308, 1317147, 1683029, 1797710, 902, 1726392, 649642, 1215748, 1242802, 1463281, 887248, 1699026, 1690855, 1474473, 1861563, 1712136, 549859, 1468484, 35023, 1775394, 1734526, 1696874, 1752080, 255756, 1678044, 1871034, 1694941, 1436146, 60, 1798030, 13116, 1120206, 1232620, 1598261, 1640593, 450528, 640630, 1672988, 811693, 1796742, 1404540, 1035325, 427720, 1691595, 1738, 1569437, 549316, 879922, 1799789, 1742611, 1687221, 1715026, 561313, 1617869, 1827679, 1733113, 1758184, 747703, 172345, 1340169, 1761060, 1827354, 1820193, 996527, 1705949, 1262155, 1676012, 1063359, 1798780, 245644, 1875895, 757936, 539485, 447208, 1490537, 1111384, 805720, 1255350, 997237, 1846152, 1178383, 1776229, 1706767, 1214063, 1452853, 1230050, 335652, 1414147, 859372, 1545753, 1638741, 1718539, 1684713, 551560, 942682, 1438403, 1696930, 1492551, 1669299, 1250994, 1682286, 1399611, 512000, 1378654, 1879634, 1339268, 1706507, 766456, 132465, 1714712, 1740207, 1464427, 1691410, 1730162, 1422567, 153231, 456140, 1726213, 1701616, 1874352, 1555589, 1743352, 1328481, 1117631, 1530001, 1633377, 312896, 1741185, 105292, 1715870, 1750502, 1737754, 454368, 122112, 1755514, 1687940, 442688, 1826265, 1433647, 1477957, 1794091, 556222, 1749836, 975, 1741909, 1649145, 1787994, 264468, 1787905, 359908, 78781, 1728054, 1489816, 338264, 1678008, 1692150, 1755059, 1418167, 1560125, 1674135, 1075684, 1645345, 1867372, 1402536, 1443991, 1471004, 1113415, 81398, 1723401, 478416, 1200914, 120450, 1202280, 1041479, 1597269, 1746666, 1865320, 1121678, 1747491, 1744206, 444452, 1745611, 280932, 1794427, 399596, 13578, 1797359, 456192, 1736376, 1498710, 1744940, 1104414, 1708161, 1681512, 1167810, 1749008, 42538, 1428712, 1675481, 1764305, 1800234, 1347086, 26235, 1743135, 1780920, 1707105, 400916, 1242643, 1229506, 933358, 1700640, 1822471, 1034291, 817963, 1489780, 1094212, 1218171, 255484, 1370693, 1454261, 1711067, 458104, 1402193, 1810166, 1714086, 1362189, 419456, 1454474, 712714, 1071749, 1033765, 1431274, 1777512, 1850796, 1692141, 1897397, 1534386, 1794590, 4961, 1014705, 1142441, 1792078, 1451446, 1639813, 342360, 423704, 1442914, 1679267, 98040, 1530357, 1604189, 1007297, 1798785, 1696864, 941419, 1458063, 1685663, 572263, 1417354, 1692941, 1374468, 1803260, 1318335, 938509, 1437099, 1271390, 1797676, 1827968, 1859784, 1696086, 1119606, 17872, 1340408, 1808989, 1704430, 1353643, 7744, 1528258, 1759287, 1566302, 1792049, 1740933, 1700194, 1728590, 1684739, 1799184]


# python -m pytest  -s  -W ignore::DeprecationWarning ./tests/test_add_voz_ignored_users.py
class TestMockAuthentication:
    @classmethod
    def setup_class(cls):
        mock_no_authentication()

    @pytest.mark.skip(reason="Just for demo")
    @pytest.mark.anyio
    async def test_create_voz_dummy_report_data(self, client_test: AsyncClient):
        # generate data
        new_report_data = await ReportData(
            reporter="r1",
            status="unconfirmed",
            reported_user = "rt1",
            note="testuser",
            tags=["t1", "t2"],
            urlRecorded="url1",
            platformUrl="voz.vn",
            relatedPlatforms=[],
            unixTime=0,
            data_url_array=[],
        ).create()

        response = await client_test.get(f"/report-data/{new_report_data.id}")
        # pprint(json.dumps(response.json(), indent=4))
        assert response.status_code == 200
        await client_test.delete(f"/report-data/{new_report_data.id}")

    @pytest.mark.anyio
    async def test_create_confirmed_voz_reports(self, client_test: AsyncClient):
        for i in range(3, len(ignored_users)):
            # generate data
            new_report_data = await ReportData(
                reporter="chupmu_backend_tests",
                status="confirmed",
                reported_user = str(ignored_users[i]),
                note="Taken from a confirmed list, mostly from f33. Belongs to either tags: ngu, bo-do, pro-nga, troll, clone-account",
                tags=["test", "private-list"],
                urlRecorded="https://voz.vn/f/diem-bao.33/",
                platformUrl="voz.vn",
                relatedPlatforms=[],
                unixTime=int(time.time() * 1000),
                data_url_array=[],
            ).create()

            response = await client_test.get(f"/report-data/{new_report_data.id}")
            # pprint(json.dumps(response.json(), indent=4))
            assert response.status_code == 200



    @pytest.mark.skip(reason="Just for demo")
    @pytest.mark.anyio
    async def test_get_all_students(self, client_test: AsyncClient):
        response = await client_test.get("/student/")
        pprint(json.dumps(response.json(), indent=4))
        assert response.status_code == 200