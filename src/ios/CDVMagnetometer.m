#import <CoreLocation/CoreLocation.h>
#import "CDVMagnetometer.h"

@interface CDVMagnetometer () {}
@property (readwrite, assign) BOOL isRunning;
@property (readwrite, assign) BOOL haveReturnedResult;
@property (readwrite, strong) CLLocationManager* locationManager;
@property (readwrite, assign) double x;
@property (readwrite, assign) double y;
@property (readwrite, assign) double z;
@property (readwrite, assign) NSTimeInterval timestamp;
@end

@implementation CDVMagnetometer

@synthesize callbackId, isRunning, x, y, z, timestamp;

- (CDVMagnetometer*)init
{
    self = [super init];
    if (self) {
        self.x = 0;
        self.y = 0;
        self.z = 0;
        self.timestamp = 0;
        self.callbackId = nil;
        self.isRunning = NO;
        self.haveReturnedResult = YES;
        self.locationManager = nil;
    }
    return self;
}

- (void)dealloc
{
    [self stop:nil];
}

- (void)start:(CDVInvokedUrlCommand*)command
{
    self.haveReturnedResult = NO;
    self.callbackId = command.callbackId;

    if (!self.locationManager)
    {
        self.locationManager = [[CLLocationManager alloc] init];
    }

    if ([self.locationManager headingAvailable] == YES) {
        // heading service configuration
        self.locationManager.headingFilter = kCLHeadingFilterNone;
        // setup delegate callbacks
        self.locationManager.delegate = self;

        [self.locationManager startUpdatingHeading];

        if (!self.isRunning) {
            self.isRunning = YES;
        }
    } else {

        NSLog(@"Running in Simulator? All magnetic tests will fail.");
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION messageAsString:@"Error. Magnetometer Not Available."];

        [self.commandDelegate sendPluginResult:result callbackId:self.callbackId];
    }
}

// This delegate method is invoked when the location manager has heading data.
- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)heading
{
    self.x = heading.x;
    self.y = heading.y;
    self.z = heading.z;
    self.timestamp = ([[NSDate date] timeIntervalSince1970] * 1000);
    [self returnMagneticInfo];
}

- (void)onReset
{
    [self stop:nil];
}

- (void)stop:(CDVInvokedUrlCommand*)command
{
    if ([self.locationManager headingAvailable] == YES) {
        if (self.haveReturnedResult == NO) {
            // block has not fired before stop was called, return whatever result we currently have
            [self returnMagneticInfo];
        }
        [self.locationManager stopUpdatingHeading];
    }
    self.isRunning = NO;
}

- (void)returnMagneticInfo
{
    // Create an orientation object
    NSMutableDictionary* orientationProps = [NSMutableDictionary dictionaryWithCapacity:4];

    [orientationProps setValue:[NSNumber numberWithDouble:x] forKey:@"x"];
    [orientationProps setValue:[NSNumber numberWithDouble:y] forKey:@"y"];
    [orientationProps setValue:[NSNumber numberWithDouble:z] forKey:@"z"];
    [orientationProps setValue:[NSNumber numberWithDouble:timestamp] forKey:@"timestamp"];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:orientationProps];
    [result setKeepCallback:[NSNumber numberWithBool:YES]];
    [self.commandDelegate sendPluginResult:result callbackId:self.callbackId];
    self.haveReturnedResult = YES;
}

@end
