window.onload = function() {
    if (typeof kakao !== 'undefined' && kakao.maps) {
        initializeMap();
    } else {
        console.error('Kakao Maps API를 로드할 수 없습니다.');
    }
};

function initializeMap() {
    var mapContainer = document.getElementById('map');
    var mapOptions = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOptions);

    var geocoder = new kakao.maps.services.Geocoder();
    var markers = [];
    var pointsData = [];
    var markerTableBody = document.getElementById('markerTable').getElementsByTagName('tbody')[0];

    window.searchAddress = function() {
        var address = document.getElementById('address').value;
        geocoder.addressSearch(address, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                map.setCenter(coords);
            } else {
                alert('주소를 찾을 수 없습니다.');
            }
        });
    }

    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        var latlng = mouseEvent.latLng;
        addMarker(latlng);
    });

    function addMarker(latlng) {
        var marker = new kakao.maps.Marker({
            position: latlng
        });
        marker.setMap(map);
        markers.push(marker);

        kakao.maps.event.addListener(marker, 'click', function() {
            removeMarker(marker, latlng);
        });

        geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                var roadAddress = result[0].road_address ? result[0].road_address.address_name : '';
                var jibunAddress = result[0].address ? result[0].address.address_name : '';
                var pointInfo = {
                    no: pointsData.length + 1,
                    lat: latlng.getLat(),
                    lng: latlng.getLng(),
                    roadAddress: roadAddress,
                    jibunAddress: jibunAddress
                };
                pointsData.push(pointInfo);
                addRowToTable(pointInfo);
            }
        });
    }

    function removeMarker(marker, latlng) {
        marker.setMap(null);

        // markers 배열에서 마커 삭제
        markers = markers.filter(m => !m.getPosition().equals(latlng));

        // pointsData 배열에서 관련 데이터 삭제
        pointsData = pointsData.filter(point => point.lat !== latlng.getLat() || point.lng !== latlng.getLng());

        // 테이블 업데이트
        updateTable();
    }

    function addRowToTable(point) {
        var row = markerTableBody.insertRow();
        row.setAttribute('data-lat', point.lat);
        row.setAttribute('data-lng', point.lng);
        row.insertCell(0).innerText = point.no;
        row.insertCell(1).innerText = point.roadAddress;
        row.insertCell(2).innerText = point.jibunAddress;
        row.insertCell(3).innerText = point.lat;
        row.insertCell(4).innerText = point.lng;
    }

    function updateTable() {
        markerTableBody.innerHTML = '';
        pointsData.forEach(function(point, index) {
            point.no = index + 1;
            addRowToTable(point);
        });
    }

    window.downloadCSV = function() {
        var csv = '\uFEFFNO.,Road Address,Jibun Address,Latitude,Longitude\n';
        pointsData.forEach(function(point) {
            csv += point.no + ',' + point.roadAddress + ',' + point.jibunAddress + ',' + point.lat + ',' + point.lng + '\n';
        });

        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=euc-kr,' + encodeURI(csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'points_data.csv';
        hiddenElement.click();
    }
}
