window.onload = function() {
    // API가 로드되었는지 확인하고 실행
    if (typeof kakao !== 'undefined' && kakao.maps) {
        initializeMap();
    } else {
        console.error('Kakao Maps API를 로드할 수 없습니다.');
    }
};

function initializeMap() {
    // 카카오 맵 초기화
    var mapContainer = document.getElementById('map');
    var mapOptions = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3
    };
    var map = new kakao.maps.Map(mapContainer, mapOptions);

    // 장소 검색 서비스 객체를 생성합니다
    var ps = new kakao.maps.services.Places();

    // 주소-좌표 변환 객체를 생성합니다
    var geocoder = new kakao.maps.services.Geocoder();

    var markers = [];
    var pointsData = [];
    var markerTableBody = document.getElementById('markerTable').getElementsByTagName('tbody')[0];

    // 주소 검색 함수
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

    // 지도 클릭 이벤트 추가
    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        var latlng = mouseEvent.latLng;

        // 이미 해당 위치에 마커가 존재하는지 확인
        var existingMarker = markers.find(marker => marker.getPosition().equals(latlng));

        if (existingMarker) {
            // 마커가 존재하면 삭제
            removeMarker(existingMarker);
        } else {
            // 마커가 존재하지 않으면 생성
            addMarker(latlng);
        }
    });

    // 마커 추가 함수
    function addMarker(latlng) {
        var marker = new kakao.maps.Marker({
            position: latlng
        });
        marker.setMap(map);
        markers.push(marker);

        // 마커 클릭 이벤트 추가 (클릭 시 마커 삭제)
        kakao.maps.event.addListener(marker, 'click', function() {
            removeMarker(marker);
        });

        // 좌표에 대한 주소 정보 가져오기
        geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                var roadAddr = result[0].road_address ? result[0].road_address.address_name : '';
                var jibunAddr = result[0].address ? result[0].address.address_name : '';
                var pointInfo = {
                    no: pointsData.length + 1,
                    lat: latlng.getLat(),
                    lng: latlng.getLng(),
                    roadAddress: roadAddr,
                    jibunAddress: jibunAddr
                };
                pointsData.push(pointInfo);
                addRowToTable(pointInfo);
            }
        });
    }

    // 마커 제거 함수
    function removeMarker(marker) {
        var latlng = marker.getPosition();
        marker.setMap(null);
        markers = markers.filter(m => !m.getPosition().equals(latlng));
        pointsData = pointsData.filter(point => point.lat !== latlng.getLat() || point.lng !== latlng.getLng());
        updateTable();
    }

    // 테이블에 행 추가 함수
    function addRowToTable(point) {
        var row = markerTableBody.insertRow();
        row.insertCell(0).innerText = point.no;
        row.insertCell(1).innerText = point.roadAddress;
        row.insertCell(2).innerText = point.jibunAddress;
        row.insertCell(3).innerText = point.lat;
        row.insertCell(4).innerText = point.lng;
    }

    // 테이블 업데이트 함수
    function updateTable() {
        markerTableBody.innerHTML = '';
        pointsData.forEach(function(point, index) {
            point.no = index + 1;
            addRowToTable(point);
        });
    }

    // CSV 다운로드 함수
    window.downloadCSV = function() {
        var csv = 'NO.,Road Address,Jibun Address,Latitude,Longitude\n';
        pointsData.forEach(function(point) {
            csv += point.no + ',' + point.roadAddress + ',' + point.jibunAddress + ',' + point.lat + ',' + point.lng + '\n';
        });

        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURI(csv);  // UTF-8 BOM 추가
        hiddenElement.target = '_blank';
        hiddenElement.download = 'points_data.csv';
        hiddenElement.click();
    }
}
